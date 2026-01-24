import bcrypt from 'bcryptjs'
import { createHash, randomBytes } from 'node:crypto'
import {
    IDatabase,
    ILogger,
    ISessionService,
    IEmailService,
    IConfig,
    IAuditService,
} from '../types/core.js'

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
    return s
}
// ...
// Helper imports - assuming we can import them from original locations or duplicates
// Ideally we should move these helpers to src/utils or src/helpers in clean architecture
import { parseLoginBody, parseLoginVerifyBody } from '../helpers/http-validators.js'

export class SessionManager implements ISessionService {
    private db: IDatabase
    private log: ILogger
    private config: IConfig
    private msgs: any
    private email: IEmailService
    private audit: IAuditService
    private v: any // Validator

    // Cache config values
    private serverErrors: any
    private clientErrors: any
    private successMsgs: any
    private authCfg: any
    private loginId: string
    private requireEmailVerification: boolean

    constructor(deps: {
        db: IDatabase
        log: ILogger
        config: IConfig
        msgs: any
        email: IEmailService
        audit: IAuditService
        v?: any
    }) {
        this.db = deps.db
        this.log = deps.log
        this.config = deps.config
        this.msgs = deps.msgs
        this.email = deps.email
        this.audit = deps.audit
        this.v = deps.v

        const lang = this.config.app.lang || 'es'
        this.serverErrors = this.msgs[lang].errors.server
        this.clientErrors = this.msgs[lang].errors.client
        this.successMsgs = this.msgs[lang].success

        this.authCfg = this.config.auth ?? {}
        this.loginId = String(this.authCfg.loginId ?? 'email')
            .trim()
            .toLowerCase()
        this.requireEmailVerification = Boolean(this.authCfg.requireEmailVerification)
    }

    sessionExists(req: any) {
        if (req.session && req.session.user_id) return true
        return false
    }

    async createSession(req: any, res: any) {
        try {
            // Context Mock for helpers that need it
            const ctxHelper = {
                config: this.config,
                msgs: this.msgs,
                log: this.log,
                db: this.db,
                v: this.v,
            }

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

            req.session!.user_id = user.user_id
            req.session!.user_na = user.user_na || user.username
            req.session!.profile_id = user.profile_id

            try {
                await this.db.exe('security', 'updateUserLastLogin', [user.user_id])
            } catch {}

            try {
                await this.db.exe('security', 'updateUserLastLogin', [user.user_id])
            } catch {}

            await this.audit.log(req, {
                action: 'login',
                user_id: user.user_id,
                profile_id: user.profile_id,
                details: { user_na: user.user_na || user.username },
            })

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

    destroySession(req: any) {
        try {
            req.session?.destroy?.()
        } catch {}
    }
}
