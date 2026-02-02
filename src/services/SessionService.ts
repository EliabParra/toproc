import bcrypt from 'bcryptjs'
import type {
    IDatabase,
    ILogger,
    ISessionService,
    IConfig,
    IAuditService,
    II18nService,
    AppRequest,
    ValidationError,
    SessionResult,
} from '../types/index.js'
import { LoginSchema, LoginInput, SessionUserRow } from './schemas/session.js'
import { ValidatorService } from './ValidatorService.js'
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
    private validator: ValidatorService

    private authCfg: Record<string, unknown>
    private requireEmailVerification: boolean

    constructor(deps: {
        db: IDatabase
        log: ILogger
        config: IConfig
        i18n: II18nService
        audit: IAuditService
        validator: ValidatorService
    }) {
        this.db = deps.db
        this.log = deps.log.child({ category: 'Session' })
        this.config = deps.config
        this.i18n = deps.i18n
        this.audit = deps.audit
        this.validator = deps.validator

        // No longer need manual casting or get() calls
        // We will access this.i18n.messages directly in methods

        this.authCfg = (this.config.auth ?? {}) as Record<string, unknown>
        this.requireEmailVerification = Boolean(this.authCfg.requireEmailVerification)
    }

    /**
     * Verifica si una sesión de usuario está actualmente activa.
     *
     * @param req - Objeto Request de Express con la sesión
     * @returns `true` si existe userId en la sesión
     */
    sessionExists(req: AppRequest): boolean {
        return !!(req.session && req.session.userId)
    }

    /**
     * Autentica a un usuario y establece una nueva sesión.
     *
     * @param req - Objeto Request que contiene las credenciales (body) y la sesión
     * @returns Promesa con el resultado de la operación (éxito, error o fallo de validación)
     */
    async createSession(req: AppRequest): Promise<SessionResult> {
        try {
            const validation = this.validateLoginRequest(req)
            if (!validation.success) {
                return {
                    status: 'validation_error',
                    error: this.i18n.messages.errors.client.invalidParameters,
                    errors: validation.errors,
                    alerts: this.validator.getAlerts(validation.errors),
                }
            }

            if (this.sessionExists(req)) {
                return { status: 'error', error: this.i18n.messages.errors.client.sessionExists }
            }

            const { identifier, password } = validation.data
            const user = await this.findUserByIdentifier(identifier)

            if (!user || !(await this.passwordsMatch(password, user.password_hash))) {
                return {
                    status: 'error',
                    error: this.i18n.messages.errors.client.usernameOrPasswordIncorrect,
                }
            }

            if (this.isEmailVerificationPending(user)) {
                return { status: 'error', error: this.i18n.messages.errors.client.emailNotVerified }
            }

            this.initializeUserSession(req, user)

            await this.updateUserStats(user.id)
            await this.auditLoginSuccess(req, user)

            return { status: 'success', user, msg: this.i18n.messages.success.login }
        } catch (error) {
            // En caso de error de sistema, lo relanzamos o devolvemos error genérico
            // Para mantener consistencia con dispatcher, devolvemos result de error tras loguear
            this.logSystemError(req, error)
            return {
                status: 'error',
                error: this.i18n.messages.errors.client.unknown || {
                    code: 500,
                    msg: 'Unknown Error',
                },
            }
        }
    }

    /**
     * Destruye la sesión actual del usuario (Logout).
     *
     * @param req - Objeto Request con la sesión a destruir
     */
    destroySession(req: AppRequest): void {
        try {
            req.session?.destroy?.(() => {})
        } catch {}
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
    // Private Helpers (SRP & Readability)
    // =========================================================================

    private logSystemError(req: AppRequest, error: unknown): void {
        const msg = this.i18n.messages.errors.server.serverError.msg || 'Server Error'
        const status = this.i18n.messages.errors.server.serverError.code || 500

        this.log.error(
            `${msg}, SessionManager.createSession: ${error instanceof Error ? error.message : String(error)}`,
            {
                requestId: req.requestId,
                method: req.method,
                path: req.originalUrl,
                status,
                userId: req.session?.userId,
            }
        )
    }
}
