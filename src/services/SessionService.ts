import bcrypt from 'bcryptjs'
import { createHash, randomBytes } from 'node:crypto'
import {
    IDatabase,
    ILogger,
    ISessionService,
    IEmailService,
    IConfig,
    IAuditService,
    II18nService,
} from '../types/core.js'

function sha256Hex(value: unknown) {
    return createHash('sha256').update(String(value), 'utf8').digest('hex')
}

function looksLikeEmail(value: string) {
    return value.includes('@')
}

function getCookie(req: AppRequest, name: string) {
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

const SessionQueries = {
    getUserByEmail: `
        SELECT u.user_id, u.user_na, u.user_em, u.email_verified_at, u.user_pw, p.profile_id
        FROM security.users u
        LEFT JOIN security.users_profiles p ON u.user_id = p.user_id
        WHERE u.user_em = $1
    `,
    getUserByUsername: `SELECT user_id, user_na, user_em, user_pw, email_verified_at FROM security.users WHERE user_na = $1`,
    updateUserLastLogin: `
        UPDATE security.users SET last_login_at = NOW(), updated_at = NOW() WHERE user_id = $1
    `,
}

/**
 * Gestor de sesiones de usuario.
 *
 * Responsable de:
 * 1. Autenticación de usuarios (login)
 * 2. Validación de credenciales (bcrypt)
 * 3. Gestión del estado de sesión (cookie/store)
 * 4. Auditoría de accesos
 *
 */
export class SessionManager implements ISessionService {
    private db: IDatabase
    private log: ILogger
    private config: IConfig
    private i18n: II18nService
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

    /**
     * Crea una instancia de SessionManager.
     *
     * @param deps - Dependencias requeridas
     */
    constructor(deps: {
        db: IDatabase
        log: ILogger
        config: IConfig
        i18n: II18nService
        email: IEmailService
        audit: IAuditService
        v?: any
    }) {
        this.db = deps.db
        this.log = deps.log
        this.config = deps.config
        this.i18n = deps.i18n
        this.email = deps.email
        this.audit = deps.audit
        this.v = deps.v

        this.serverErrors = this.i18n.get('errors.server')
        this.clientErrors = this.i18n.get('errors.client')
        this.successMsgs = this.i18n.get('success')

        this.authCfg = this.config.auth ?? {}
        this.loginId = String(this.authCfg.loginId ?? 'email')
            .trim()
            .toLowerCase()
        this.requireEmailVerification = Boolean(this.authCfg.requireEmailVerification)
    }

    /**
     * Verifica si existe una sesión activa en el request.
     *
     * @param req - Request Express
     * @returns {boolean} True si hay sesión con user_id
     */
    sessionExists(req: AppRequest) {
        if (req.session && req.session.user_id) return true
        return false
    }

    /**
     * Crea una nueva sesión (Login).
     * Valida credenciales, crea la sesión y retorna respuesta HTTP.
     *
     * @param req - Request Express
     * @param res - Response Express
     * @returns {Promise<any>} Respuesta HTTP
     */
    async createSession(req: AppRequest, res: AppResponse) {
        try {
            // Context for helpers that need it
            const ctxHelper = {
                config: this.config,
                i18n: this.i18n,
                log: this.log,
                db: this.db,
                v: this.v,
            }

            // Inline validation logic from legacy http-validators
            const body = req.body
            const alerts: string[] = []

            if (!body || typeof body !== 'object' || Array.isArray(body)) {
                alerts.push(this.v.getMessage('object', { value: body, label: 'body' }))
            } else {
                const hasIdentifier =
                    typeof (body as any).identifier === 'string' ||
                    typeof (body as any).email === 'string' ||
                    typeof (body as any).username === 'string'

                if (!hasIdentifier) {
                    const value =
                        (body as any).identifier ?? (body as any).email ?? (body as any).username
                    alerts.push(this.v.getMessage('string', { value, label: 'identifier' }))
                }

                if (typeof (body as any).password !== 'string') {
                    alerts.push(
                        this.v.getMessage('string', {
                            value: (body as any).password,
                            label: 'password',
                        })
                    )
                } else if ((body as any).password.length < 8) {
                    alerts.push(
                        this.v.getMessage('length', {
                            value: (body as any).password,
                            label: 'password',
                            min: 8,
                        })
                    )
                }
            }

            if (alerts.length > 0) {
                return res.status(this.clientErrors.invalidParameters.code).send({
                    msg: this.clientErrors.invalidParameters.msg,
                    code: this.clientErrors.invalidParameters.code,
                    alerts: alerts,
                })
            }

            // Normalize body
            const b = body as {
                identifier?: string
                email?: string
                username?: string
                password: string
            }
            const identifier =
                typeof b.identifier === 'string'
                    ? b.identifier
                    : typeof b.email === 'string'
                      ? b.email
                      : (b.username as string)

            if (this.sessionExists(req)) {
                return res.status(this.clientErrors.sessionExists.code).send({
                    msg: this.clientErrors.sessionExists.msg,
                    code: this.clientErrors.sessionExists.code,
                })
            }

            // b and identifier are already defined above
            const queryName = looksLikeEmail(identifier)
                ? SessionQueries.getUserByEmail
                : SessionQueries.getUserByUsername
            const result = await this.db.query(queryName, [identifier])
            if (!result?.rows || result.rows.length === 0) {
                return res
                    .status(this.clientErrors.usernameOrPasswordIncorrect.code)
                    .send(this.clientErrors.usernameOrPasswordIncorrect)
            }

            const user = result.rows[0]
            const storedHash = user.user_pw || user.password || user.password_hash // Support legacy/refactored columns
            const ok =
                typeof storedHash === 'string' && (await bcrypt.compare(b.password, storedHash))
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
                await this.db.query(SessionQueries.updateUserLastLogin, [user.user_id])
            } catch {}

            try {
                await this.db.query(SessionQueries.updateUserLastLogin, [user.user_id])
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

    /**
     * Destruye la sesión actual (Logout).
     *
     * @param req - Request Express
     */
    destroySession(req: AppRequest) {
        try {
            req.session?.destroy?.(() => {})
        } catch {}
    }
}
