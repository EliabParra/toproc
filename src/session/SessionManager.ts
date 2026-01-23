import bcrypt from 'bcryptjs'
import { createHash, randomBytes } from 'node:crypto'
import { IDatabase, ILogger, ISessionService, IEmailService, IConfig } from '../types/core.js'

function sha256Hex(value: unknown) {
    return createHash('sha256').update(String(value), 'utf8').digest('hex')
}

function looksLikeEmail(value: string) {
    return value.includes('@')
}

function getCookie(req: any, name: string) {
    const header = req.headers?.cookie
    if (typeof header !== 'string' || header.length === 0) return null
    const parts = header.split(';')
    for (const part of parts) {
        const i = part.indexOf('=')
        if (i <= 0) continue
        const k = part.slice(0, i).trim()
        if (k !== name) continue
        return decodeURIComponent(part.slice(i + 1).trim())
    }
    return null
}

function redactSecretsInString(s: string): string {
    // Basic implementation of helper - ideally should be imported from helpers/sanitize.js
    // Re-implementing simplified version to avoid deep coupling or import path issues during refactor
    return s // Placeholder, practically we should import it
}

// Helper imports - assuming we can import them from original locations or duplicates
// Ideally we should move these helpers to src/utils or src/helpers in clean architecture
import { parseLoginBody, parseLoginVerifyBody } from '../BSS/helpers/http-validators.js'
import { auditBestEffort } from '../BSS/helpers/audit-log.js'

export class SessionManager implements ISessionService {
    private db: IDatabase
    private log: ILogger
    private config: IConfig
    private msgs: any
    private email: IEmailService

    // Cache config values
    private serverErrors: any
    private clientErrors: any
    private successMsgs: any
    private authCfg: any
    private loginId: string
    private login2StepNewDevice: boolean
    private deviceCookieName: string
    private deviceCookieMaxAgeMs: number
    private loginChallengeExpiresSeconds: number
    private loginChallengeMaxAttempts: number
    private requireEmailVerification: boolean

    constructor(deps: {
        db: IDatabase
        log: ILogger
        config: IConfig
        msgs: any
        email: IEmailService
    }) {
        this.db = deps.db
        this.log = deps.log
        this.config = deps.config
        this.msgs = deps.msgs
        this.email = deps.email

        const lang = this.config.app.lang || 'es'
        this.serverErrors = this.msgs[lang].errors.server
        this.clientErrors = this.msgs[lang].errors.client
        this.successMsgs = this.msgs[lang].success

        this.authCfg = this.config.auth ?? {}
        this.loginId = String(this.authCfg.loginId ?? 'email')
            .trim()
            .toLowerCase()
        this.login2StepNewDevice = Boolean(this.authCfg.login2StepNewDevice)
        this.deviceCookieName = String(this.authCfg.deviceCookieName ?? 'device_token')
        this.deviceCookieMaxAgeMs = Number(this.authCfg.deviceCookieMaxAgeMs ?? 15552000000)
        this.loginChallengeExpiresSeconds = Number(this.authCfg.loginChallengeExpiresSeconds ?? 600)
        this.loginChallengeMaxAttempts = Number(this.authCfg.loginChallengeMaxAttempts ?? 5)
        this.requireEmailVerification = Boolean(this.authCfg.requireEmailVerification)
    }

    sessionExists(req: any) {
        if (req.session && req.session.user_id) return true
        return false
    }

    async createSession(req: any, res: any) {
        try {
            // Context Mock for helpers that need it
            const ctxHelper = { config: this.config, msgs: this.msgs, log: this.log, db: this.db }

            const parsed = parseLoginBody(req.body, ctxHelper as any, { minPasswordLen: 8 })
            if (parsed.ok === false) {
                return res.status(this.clientErrors.invalidParameters.code).send({
                    msg: this.clientErrors.invalidParameters.msg,
                    code: this.clientErrors.invalidParameters.code,
                    alerts: parsed.alerts,
                })
            }

            if (this.sessionExists(req)) {
                return res.status(this.clientErrors.sessionExists.code).send({
                    msg: this.clientErrors.sessionExists.msg,
                    code: this.clientErrors.sessionExists.code,
                })
            }

            const body = parsed.body
            const identifier = body.identifier
            const queryName = looksLikeEmail(identifier) ? 'getUserByEmail' : 'getUserByUsername'
            const result = await this.db.exe('security', queryName, [identifier])
            if (!result?.rows || result.rows.length === 0) {
                return res
                    .status(this.clientErrors.usernameOrPasswordIncorrect.code)
                    .send(this.clientErrors.usernameOrPasswordIncorrect)
            }

            const user = result.rows[0]
            const storedHash = user.user_pw || user.password || user.password_hash // Support legacy/refactored columns
            const ok =
                typeof storedHash === 'string' && (await bcrypt.compare(body.password, storedHash))
            if (!ok)
                return res
                    .status(this.clientErrors.usernameOrPasswordIncorrect.code)
                    .send(this.clientErrors.usernameOrPasswordIncorrect)

            if (this.requireEmailVerification) {
                const email = user.user_em || user.email
                if (typeof email !== 'string' || email.trim().length === 0) {
                    return res
                        .status(this.clientErrors.emailRequired.code)
                        .send(this.clientErrors.emailRequired)
                }
                if (!user.email_verified_at) {
                    return res
                        .status(this.clientErrors.emailNotVerified.code)
                        .send(this.clientErrors.emailNotVerified)
                }
            }

            if (this.login2StepNewDevice) {
                const email = user.user_em || user.email
                if (typeof email !== 'string' || email.trim().length === 0) {
                    return res
                        .status(this.clientErrors.emailRequired.code)
                        .send(this.clientErrors.emailRequired)
                }

                const deviceToken = getCookie(req, this.deviceCookieName)
                const deviceTokenHash = deviceToken ? sha256Hex(deviceToken) : null

                if (deviceTokenHash) {
                    const d = await this.db.exe(
                        'security',
                        'getActiveUserDeviceByUserAndTokenHash',
                        [user.user_id, deviceTokenHash]
                    )
                    if (d?.rows?.length > 0) {
                        try {
                            await this.db.exe('security', 'touchUserDevice', [
                                user.user_id,
                                deviceTokenHash,
                                req.get?.('User-Agent') ?? null,
                                req.ip ?? null,
                            ])
                        } catch {}
                    } else {
                        return await this._startLoginChallenge(req, res, user)
                    }
                } else {
                    return await this._startLoginChallenge(req, res, user)
                }
            }

            req.session!.user_id = user.user_id
            req.session!.user_na = user.user_na || user.username
            req.session!.profile_id = user.profile_id

            try {
                await this.db.exe('security', 'updateUserLastLogin', [user.user_id])
            } catch {}

            await auditBestEffort(
                req,
                {
                    action: 'login',
                    user_id: user.user_id,
                    profile_id: user.profile_id,
                    details: { user_na: user.user_na || user.username },
                },
                ctxHelper as any
            )

            return res.status(this.successMsgs.login.code).send(this.successMsgs.login)
        } catch (err: any) {
            const status = this.clientErrors.unknown.code
            try {
                res.locals.__errorLogged = true
            } catch {}
            this.log.show({
                type: this.log.TYPE_ERROR,
                msg: `${this.serverErrors.serverError.msg}, SessionManager.createSession: ${err?.message || err}`,
                ctx: {
                    requestId: req.requestId,
                    method: req.method,
                    path: req.originalUrl,
                    status,
                    user_id: req.session?.user_id,
                },
            })
            return res.status(status).send(this.clientErrors.unknown)
        }
    }

    async _startLoginChallenge(req: any, res: any, user: any) {
        const token = randomBytes(32).toString('hex')
        const code = String(Math.floor(100000 + Math.random() * 900000))
        const tokenHash = sha256Hex(token)
        const codeHash = sha256Hex(code)

        await this.db.exe('security', 'insertLoginChallenge', [
            user.user_id,
            tokenHash,
            codeHash,
            String(this.loginChallengeExpiresSeconds),
            req.ip ?? null,
            req.get?.('User-Agent') ?? null,
        ])

        await this.email.sendLoginChallenge({
            to: user.user_em || user.email,
            token,
            code,
            appName: this.config.app.name,
        })

        const ctxHelper = { config: this.config, msgs: this.msgs, log: this.log, db: this.db }
        await auditBestEffort(
            req,
            {
                action: 'login_challenge_sent',
                user_id: user.user_id,
                profile_id: user.profile_id,
                details: { sentTo: this.email.maskEmail(user.user_em || user.email) },
            },
            ctxHelper as any
        )

        return res.status(this.successMsgs.loginVerificationRequired.code).send({
            ...this.successMsgs.loginVerificationRequired,
            challengeToken: token,
            sentTo: this.email.maskEmail(user.user_em || user.email),
        })
    }

    async verifyLoginChallenge(req: any, res: any) {
        try {
            if (this.sessionExists(req)) {
                return res
                    .status(this.clientErrors.sessionExists.code)
                    .send(this.clientErrors.sessionExists)
            }

            const ctxHelper = { config: this.config, msgs: this.msgs, log: this.log, db: this.db }
            const parsed = parseLoginVerifyBody(req.body, ctxHelper as any)
            if (parsed.ok === false) {
                return res
                    .status(this.clientErrors.invalidParameters.code)
                    .send(this.clientErrors.invalidParameters)
            }

            const token = parsed.body.token
            const code = parsed.body.code

            const tokenHash = sha256Hex(token)
            const r = await this.db.exe('security', 'getLoginChallengeByTokenHash', [tokenHash])
            const row = r?.rows?.[0]
            if (!row) {
                return res
                    .status(this.clientErrors.invalidToken.code)
                    .send(this.clientErrors.invalidToken)
            }

            if (row.verified_at) {
                return res
                    .status(this.clientErrors.invalidToken.code)
                    .send(this.clientErrors.invalidToken)
            }

            const expiresAt = row.expires_at ? new Date(row.expires_at) : null
            if (
                !expiresAt ||
                Number.isNaN(expiresAt.getTime()) ||
                expiresAt.getTime() <= Date.now()
            ) {
                return res
                    .status(this.clientErrors.expiredToken.code)
                    .send(this.clientErrors.expiredToken)
            }

            const attempts = Number(row.attempt_count ?? 0)
            if (
                Number.isFinite(this.loginChallengeMaxAttempts) &&
                attempts >= this.loginChallengeMaxAttempts
            ) {
                return res
                    .status(this.clientErrors.tooManyRequests.code)
                    .send(this.clientErrors.tooManyRequests)
            }

            const codeHash = sha256Hex(code)
            if (codeHash !== row.code_hash) {
                try {
                    await this.db.exe('security', 'incrementLoginChallengeAttempt', [
                        row.challenge_id || row.login_challenge_id,
                    ])
                } catch {}
                return res
                    .status(this.clientErrors.invalidToken.code)
                    .send(this.clientErrors.invalidToken)
            }

            await this.db.exe('security', 'markLoginChallengeVerified', [
                row.challenge_id || row.login_challenge_id,
            ])

            if (this.requireEmailVerification && !row.email_verified_at) {
                return res
                    .status(this.clientErrors.emailNotVerified.code)
                    .send(this.clientErrors.emailNotVerified)
            }

            // Trust this device by issuing a device token cookie
            const deviceToken = randomBytes(32).toString('hex')
            const deviceTokenHash = sha256Hex(deviceToken)
            try {
                await this.db.exe('security', 'upsertUserDevice', [
                    row.user_id,
                    deviceTokenHash,
                    req.get?.('User-Agent') ?? null,
                    req.ip ?? null,
                ])
            } catch {}

            res.cookie!(this.deviceCookieName, deviceToken, {
                httpOnly: true,
                sameSite: this.config.session?.cookie?.sameSite ?? 'lax',
                secure: Boolean(this.config.session?.cookie?.secure),
                maxAge: Number.isFinite(this.deviceCookieMaxAgeMs)
                    ? this.deviceCookieMaxAgeMs
                    : undefined,
            })
            req.session!.user_id = row.user_id
            req.session!.user_na = row.user_na || row.username
            req.session!.profile_id = row.profile_id

            try {
                await this.db.exe('security', 'updateUserLastLogin', [row.user_id])
            } catch {}

            await auditBestEffort(
                req,
                {
                    action: 'login',
                    user_id: row.user_id,
                    profile_id: row.profile_id,
                    details: { user_na: row.user_na || row.username, twoStep: true },
                },
                ctxHelper as any
            )

            return res.status(this.successMsgs.login.code).send(this.successMsgs.login)
        } catch (err: any) {
            const status = this.clientErrors.unknown.code
            try {
                res.locals.__errorLogged = true
            } catch {}
            this.log.show({
                type: this.log.TYPE_ERROR,
                msg: `${this.serverErrors.serverError.msg}, SessionManager.verifyLoginChallenge: ${err?.message || err}`,
                ctx: {
                    requestId: req.requestId,
                },
            })
            return res.status(status).send(this.clientErrors.unknown)
        }
    }

    destroySession(req: any) {
        try {
            req.session?.destroy?.()
        } catch {}
    }
}
