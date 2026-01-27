import {
    authMethods as presetAuthMethods,
    templateAuthSuccessMsgs as presetTemplateAuthSuccessMsgs,
    templateAuthErrorMsgs as presetTemplateAuthErrorMsgs,
    templateAuthAlertsLabels as presetTemplateAuthAlertsLabels,
    templateAuthErrorHandler as presetTemplateAuthErrorHandler,
    templateAuthValidate as presetTemplateAuthValidate,
    templateAuthRepo as presetTemplateAuthRepo,
    templateAuthBO as presetTemplateAuthBO,
} from '../../bo-auth-preset.js'

/**
 * AuthPreset - Plantillas para módulo de autenticación
 *
 * Genera la estructura de 7 archivos con nomenclatura Name.Type.ts:
 * - AuthBO.ts
 * - Auth.Service.ts
 * - Auth.Repository.ts
 * - Auth.Schemas.ts
 * - Auth.Types.ts
 * - Auth.Messages.ts
 * - Auth.Errors.ts
 */
export const AuthPreset = {
    methods: presetAuthMethods,

    // BO principal
    bo: presetTemplateAuthBO,

    // Repository (legacy name: repo)
    repository: presetTemplateAuthRepo,

    // Validación
    validate: presetTemplateAuthValidate,

    // Legacy JSON messages (para compatibilidad)
    success: presetTemplateAuthSuccessMsgs,
    error: presetTemplateAuthErrorMsgs,
    alerts: presetTemplateAuthAlertsLabels,
    errorHandler: presetTemplateAuthErrorHandler,

    // ============================================================
    // Nuevas plantillas para estructura de 7 archivos
    // ============================================================

    /**
     * Auth.Service.ts - Lógica de negocio de autenticación
     */
    service: () => `import { ILogger, IConfig } from '../../src/types/core.js'
import { AuthRepository } from './Auth.Repository.js'
import type { User, UserCredentials, AuthToken, Session } from './Auth.Types.js'
import { AuthNotFoundError, AuthInvalidCredentialsError } from './Auth.Errors.js'
import { AuthMessages } from './Auth.Messages.js'

/**
 * Capa de servicio para lógica de autenticación.
 * 
 * Contiene lógica de negocio pura, libre de concerns HTTP.
 */
export class AuthService {
    constructor(
        private readonly repo: AuthRepository,
        private readonly log: ILogger,
        private readonly config: IConfig
    ) {}

    /**
     * Valida credenciales y genera sesión
     */
    async login(credentials: UserCredentials): Promise<Session> {
        const user = await this.repo.findByLoginId(credentials.loginId)
        if (!user) {
            throw new AuthNotFoundError()
        }
        
        const isValid = await this.repo.verifyPassword(user.userId, credentials.password)
        if (!isValid) {
            throw new AuthInvalidCredentialsError()
        }
        
        const session = await this.repo.createSession(user.userId)
        this.log.show({ type: this.log.TYPE_INFO, msg: \`User logged in: \${user.userId}\` })
        
        return session
    }

    /**
     * Registra nuevo usuario
     */
    async register(data: Partial<User>): Promise<User> {
        this.log.show({ type: this.log.TYPE_INFO, msg: 'Creating new user' })
        return this.repo.createUser(data)
    }

    /**
     * Cierra sesión
     */
    async logout(sessionId: string): Promise<void> {
        await this.repo.deleteSession(sessionId)
    }

    /**
     * Verifica token de sesión
     */
    async verifySession(token: string): Promise<Session | null> {
        return this.repo.findSessionByToken(token)
    }
}
`,

    /**
     * Auth.Schemas.ts - Validaciones Zod
     */
    schemas: () => `import { z } from 'zod'
import { AuthMessages } from './Auth.Messages.js'

/**
 * Schemas Zod para métodos de AuthBO
 */
export const AuthSchemas = {
    login: z.object({
        loginId: z.string({ required_error: AuthMessages.VALIDATION.LOGIN_ID_REQUIRED })
            .min(1, AuthMessages.VALIDATION.LOGIN_ID_REQUIRED),
        password: z.string({ required_error: AuthMessages.VALIDATION.PASSWORD_REQUIRED })
            .min(1, AuthMessages.VALIDATION.PASSWORD_REQUIRED),
    }),

    register: z.object({
        email: z.string({ required_error: AuthMessages.VALIDATION.EMAIL_REQUIRED })
            .email(AuthMessages.VALIDATION.EMAIL_INVALID),
        password: z.string({ required_error: AuthMessages.VALIDATION.PASSWORD_REQUIRED })
            .min(8, AuthMessages.VALIDATION.PASSWORD_TOO_SHORT),
        name: z.string().optional(),
    }),

    logout: z.object({
        sessionId: z.string().optional(),
    }),

    verifyEmail: z.object({
        token: z.string({ required_error: AuthMessages.VALIDATION.TOKEN_REQUIRED }),
    }),

    resetPassword: z.object({
        email: z.string({ required_error: AuthMessages.VALIDATION.EMAIL_REQUIRED })
            .email(AuthMessages.VALIDATION.EMAIL_INVALID),
    }),

    changePassword: z.object({
        currentPassword: z.string({ required_error: AuthMessages.VALIDATION.PASSWORD_REQUIRED }),
        newPassword: z.string({ required_error: AuthMessages.VALIDATION.PASSWORD_REQUIRED })
            .min(8, AuthMessages.VALIDATION.PASSWORD_TOO_SHORT),
    }),
}

// Tipos inferidos
export type LoginInput = z.infer<typeof AuthSchemas.login>
export type RegisterInput = z.infer<typeof AuthSchemas.register>
export type LogoutInput = z.infer<typeof AuthSchemas.logout>
export type VerifyEmailInput = z.infer<typeof AuthSchemas.verifyEmail>
export type ResetPasswordInput = z.infer<typeof AuthSchemas.resetPassword>
export type ChangePasswordInput = z.infer<typeof AuthSchemas.changePassword>
`,

    /**
     * Auth.Types.ts - Interfaces TypeScript
     */
    types: () => `/**
 * Definiciones de tipos para Auth
 */

// ============================================================
// Tipos de Entidad
// ============================================================

export interface User {
    userId: number
    email: string
    name?: string
    passwordHash: string
    isEmailVerified: boolean
    isActive: boolean
    createdAt: Date
    updatedAt?: Date
}

export interface UserSummary {
    userId: number
    email: string
    name?: string
    isActive: boolean
}

export interface Session {
    sessionId: string
    userId: number
    token: string
    expiresAt: Date
    createdAt: Date
}

export interface AuthToken {
    token: string
    type: 'session' | 'email-verification' | 'password-reset'
    expiresAt: Date
}

// ============================================================
// Tipos de Entrada
// ============================================================

export interface UserCredentials {
    loginId: string
    password: string
}

export interface RegisterData {
    email: string
    password: string
    name?: string
}

export interface PasswordResetData {
    token: string
    newPassword: string
}

// ============================================================
// Tipos de Respuesta
// ============================================================

export interface LoginResult {
    user: UserSummary
    session: Session
}

export interface RegisterResult {
    user: UserSummary
    verificationSent: boolean
}
`,

    /**
     * Auth.Messages.ts - Mensajes en español
     */
    messages: () => `/**
 * Mensajes y strings para Auth
 */

export const AuthMessages = {
    // Éxito
    LOGIN_SUCCESS: 'Sesión iniciada exitosamente',
    LOGOUT_SUCCESS: 'Sesión cerrada exitosamente',
    REGISTER_SUCCESS: 'Usuario registrado exitosamente',
    EMAIL_VERIFIED: 'Email verificado exitosamente',
    PASSWORD_RESET_SENT: 'Enlace de recuperación enviado',
    PASSWORD_CHANGED: 'Contraseña actualizada exitosamente',

    // Error
    USER_NOT_FOUND: 'Usuario no encontrado',
    INVALID_CREDENTIALS: 'Credenciales inválidas',
    EMAIL_NOT_VERIFIED: 'Email no verificado',
    SESSION_EXPIRED: 'Sesión expirada',
    TOKEN_INVALID: 'Token inválido o expirado',
    EMAIL_ALREADY_EXISTS: 'Ya existe un usuario con este email',
    ACCOUNT_DISABLED: 'Cuenta deshabilitada',

    // Validación
    VALIDATION: {
        LOGIN_ID_REQUIRED: 'El email o usuario es requerido',
        PASSWORD_REQUIRED: 'La contraseña es requerida',
        PASSWORD_TOO_SHORT: 'La contraseña debe tener al menos 8 caracteres',
        EMAIL_REQUIRED: 'El email es requerido',
        EMAIL_INVALID: 'El email no es válido',
        TOKEN_REQUIRED: 'El token es requerido',
    },

    // Dinámicos
    welcomeBack: (name: string) => \`Bienvenido de nuevo, \${name}\`,
    verificationSentTo: (email: string) => \`Se envió verificación a \${email}\`,
}

export type AuthMessageKey = keyof typeof AuthMessages
export type AuthValidationKey = keyof typeof AuthMessages.VALIDATION
`,

    /**
     * Auth.Errors.ts - Clases de error
     */
    errors: () => `/**
 * Clases de Error para Auth
 */

import { AuthMessages } from './Auth.Messages.js'

export class AuthError extends Error {
    readonly code: string
    readonly status: number
    readonly details?: Record<string, unknown>

    constructor(
        message: string,
        code: string,
        status: number = 500,
        details?: Record<string, unknown>
    ) {
        super(message)
        this.name = 'AuthError'
        this.code = code
        this.status = status
        this.details = details
        
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, AuthError)
        }
    }

    toJSON() {
        return {
            name: this.name,
            message: this.message,
            code: this.code,
            status: this.status,
            details: this.details,
        }
    }
}

export class AuthNotFoundError extends AuthError {
    constructor() {
        super(AuthMessages.USER_NOT_FOUND, 'AUTH_USER_NOT_FOUND', 404)
        this.name = 'AuthNotFoundError'
    }
}

export class AuthInvalidCredentialsError extends AuthError {
    constructor() {
        super(AuthMessages.INVALID_CREDENTIALS, 'AUTH_INVALID_CREDENTIALS', 401)
        this.name = 'AuthInvalidCredentialsError'
    }
}

export class AuthEmailNotVerifiedError extends AuthError {
    constructor() {
        super(AuthMessages.EMAIL_NOT_VERIFIED, 'AUTH_EMAIL_NOT_VERIFIED', 403)
        this.name = 'AuthEmailNotVerifiedError'
    }
}

export class AuthSessionExpiredError extends AuthError {
    constructor() {
        super(AuthMessages.SESSION_EXPIRED, 'AUTH_SESSION_EXPIRED', 401)
        this.name = 'AuthSessionExpiredError'
    }
}

export class AuthTokenInvalidError extends AuthError {
    constructor() {
        super(AuthMessages.TOKEN_INVALID, 'AUTH_TOKEN_INVALID', 400)
        this.name = 'AuthTokenInvalidError'
    }
}

export class AuthEmailExistsError extends AuthError {
    constructor(email?: string) {
        super(AuthMessages.EMAIL_ALREADY_EXISTS, 'AUTH_EMAIL_EXISTS', 409, { email })
        this.name = 'AuthEmailExistsError'
    }
}

export class AuthAccountDisabledError extends AuthError {
    constructor() {
        super(AuthMessages.ACCOUNT_DISABLED, 'AUTH_ACCOUNT_DISABLED', 403)
        this.name = 'AuthAccountDisabledError'
    }
}

export function handleAuthError(error: unknown): AuthError {
    if (error instanceof AuthError) {
        return error
    }
    if (error instanceof Error) {
        return new AuthError(error.message, 'AUTH_UNKNOWN_ERROR', 500)
    }
    return new AuthError('Error desconocido en Auth', 'AUTH_UNKNOWN_ERROR', 500)
}

export function isAuthError(error: unknown): error is AuthError {
    return error instanceof AuthError
}
`,
}
