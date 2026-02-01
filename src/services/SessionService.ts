import bcrypt from 'bcryptjs'
import {
    IDatabase,
    ILogger,
    ISessionService,
    IConfig,
    IAuditService,
    II18nService,
} from '../types/core.js'
import type { AppRequest, AppResponse } from '../types/http.js'
import type { LocalizedMessages, ValidationError } from '../types/api.js'
import { LoginSchema, LoginInput, SessionUserRow } from './schemas/session.js'
import { AppValidator } from './ValidatorService.js'
import { SessionQueries } from './queries/session.js'

type ValidationResponse =
    | { success: true; data: LoginInput }
    | { success: false; errors: ValidationError[] }

/**
 * Gestor de sesiones de usuario.
 * Maneja la autenticación segura de usuarios y la gestión de sesiones.
 */
export class SessionManager implements ISessionService {
    private db: IDatabase
    private log: ILogger
    private config: IConfig
    private i18n: II18nService
    private audit: IAuditService
    private validator: AppValidator

    // Cache localized messages
    private serverErrors: LocalizedMessages
    private clientErrors: LocalizedMessages
    private successMsgs: LocalizedMessages
    private authCfg: Record<string, unknown>
    private requireEmailVerification: boolean

    constructor(deps: {
        db: IDatabase
        log: ILogger
        config: IConfig
        i18n: II18nService
        audit: IAuditService
        validator: AppValidator
    }) {
        this.db = deps.db
        this.log = deps.log
        this.config = deps.config
        this.i18n = deps.i18n
        this.audit = deps.audit
        this.validator = deps.validator

        this.serverErrors = this.i18n.get('errors.server') as LocalizedMessages
        this.clientErrors = this.i18n.get('errors.client') as LocalizedMessages
        this.successMsgs = this.i18n.get('success') as LocalizedMessages

        this.authCfg = (this.config.auth ?? {}) as Record<string, unknown>
        this.requireEmailVerification = Boolean(this.authCfg.requireEmailVerification)
    }

    /**
     * Verifica si una sesión de usuario está actualmente activa.
     */
    sessionExists(req: AppRequest): boolean {
        return !!(req.session && req.session.userId)
    }

    /**
     * Autentica a un usuario y establece una nueva sesión.
     */
    async createSession(req: AppRequest, res: AppResponse) {
        try {
            const validation = this.validateLoginRequest(req)
            if (!validation.success) {
                return this.respondValidationFailed(res, validation.errors)
            }

            if (this.sessionExists(req)) {
                return this.respondClientError(res, this.clientErrors.sessionExists)
            }

            const { identifier, password } = validation.data
            const user = await this.findUserByIdentifier(identifier)

            if (!user || !(await this.passwordsMatch(password, user.password_hash))) {
                return this.respondClientError(res, this.clientErrors.usernameOrPasswordIncorrect)
            }

            if (this.isEmailVerificationPending(user)) {
                return this.respondClientError(res, this.clientErrors.emailNotVerified)
            }

            this.initializeUserSession(req, user)

            await this.updateUserStats(user.id)
            await this.auditLoginSuccess(req, user)

            return res.status(this.successMsgs.login.code).send(this.successMsgs.login)
        } catch (error) {
            return this.handleSystemError(req, res, error)
        }
    }

    /**
     * Destruye la sesión actual del usuario (Logout).
     */
    destroySession(req: AppRequest) {
        try {
            req.session?.destroy?.(() => {})
        } catch {} // Fail silent is acceptable for logout
    }

    // =========================================================================
    // Private Helpers (SRP & Readability)
    // =========================================================================

    private validateLoginRequest(req: AppRequest): ValidationResponse {
        const result = this.validator.validate<LoginInput>(req.body, LoginSchema)
        if (!result.valid) {
            return { success: false, errors: result.errors }
        }
        return { success: true, data: result.data }
    }

    private async findUserByIdentifier(identifier: string): Promise<SessionUserRow | null> {
        const isEmail = identifier.includes('@')
        const query = isEmail ? SessionQueries.getUserByEmail : SessionQueries.getUserByUsername

        const result = await this.db.query<SessionUserRow>(query, [identifier])

        if (!result.rows || result.rows.length === 0) {
            return null
        }
        return result.rows[0]
    }

    private async passwordsMatch(provided: string, storedHash: string | null): Promise<boolean> {
        if (!storedHash) return false
        return bcrypt.compare(provided, storedHash)
    }

    private isEmailVerificationPending(user: SessionUserRow): boolean {
        return this.requireEmailVerification && !user.email_verified_at
    }

    private initializeUserSession(req: AppRequest, user: SessionUserRow): void {
        if (req.session) {
            req.session.userId = user.id
            req.session.username = user.username
            req.session.profileId = user.profile_id
            req.session.email = user.email
        }
    }

    private async updateUserStats(userId: number): Promise<void> {
        try {
            await this.db.query(SessionQueries.updateUserLastLogin, [userId])
        } catch (err) {
            // Stats update failure should not block login flow
            // Could log warning here if strict monitoring needed
        }
    }

    private async auditLoginSuccess(req: AppRequest, user: SessionUserRow): Promise<void> {
        await this.audit.log(req, {
            action: 'login',
            user_id: user.id,
            profile_id: user.profile_id,
            details: { username: user.username },
        })
    }

    // =========================================================================
    // Response Helpers
    // =========================================================================

    private respondValidationFailed(res: AppResponse, errors: ValidationError[]) {
        const alerts = this.validator.getAlerts(errors)
        return res.status(this.clientErrors.invalidParameters.code).send({
            msg: this.clientErrors.invalidParameters.msg,
            code: this.clientErrors.invalidParameters.code,
            alerts,
            errors,
        })
    }

    private respondClientError(res: AppResponse, error: { code: number; msg: string }) {
        return res.status(error.code).send(error)
    }

    private handleSystemError(req: AppRequest, res: AppResponse, error: any) {
        try {
            res.locals.__errorLogged = true
        } catch {}

        const status = this.serverErrors.serverError.code || 500
        const msg = this.serverErrors.serverError.msg || 'Server Error'

        this.log.show({
            type: this.log.TYPE_ERROR,
            msg: `${msg}, SessionManager.createSession: ${error?.message || error}`,
            ctx: {
                requestId: req.requestId,
                method: req.method,
                path: req.originalUrl,
                status,
                userId: req.session?.userId,
            },
        })

        return res
            .status(status)
            .send(this.clientErrors.unknown || { msg: 'Unknown Error', code: 500 })
    }
}
