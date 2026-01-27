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
    // Definición de métodos para la CLI
    methods: () => [
        'register',
        'requestEmailVerification',
        'verifyEmail',
        'requestPasswordReset',
        'verifyPasswordReset',
        'resetPassword',
    ],

    // ============================================================
    // Plantillas
    // ============================================================

    bo: () => `import { BaseBO, BODependencies } from '../../src/core/base/BaseBO.js'
import { ApiResponse } from '../../src/core/response/ApiResponse.js'
import { AuthService } from './Auth.Service.js'
import {
    AuthSchemas,
    RegisterInput,
    VerifyEmailInput,
    ResetPasswordInput,
    ResetPasswordConfirmInput,
} from './Auth.Schemas.js'
import { AuthMessages } from './Auth.Messages.js'
import { isAuthError } from './Auth.Errors.js'

export class AuthBO extends BaseBO {
    private service: AuthService

    constructor(deps: BODependencies) {
        super(deps)
        this.service = new AuthService(this.log, this.config)
    }

    async register(params: RegisterInput): Promise<ApiResponse> {
        try {
            const vRes = this.validate<RegisterInput>(params, AuthSchemas.register)
            if (!vRes.ok) return this.validationError(vRes.alerts)

            await this.service.register(vRes.data)
            return this.created(null, AuthMessages.REGISTER_SUCCESS)
        } catch (err) {
            if (isAuthError(err)) return this.error(err.message, err.code)
            return this.error('Error desconocido en registro')
        }
    }

    async verifyEmail(params: VerifyEmailInput): Promise<ApiResponse> {
        try {
            const vRes = this.validate<VerifyEmailInput>(params, AuthSchemas.verifyEmail)
            if (!vRes.ok) return this.validationError(vRes.alerts)

            await this.service.verifyEmail(vRes.data.token)
            return this.success(null, AuthMessages.EMAIL_VERIFIED)
        } catch (err) {
            if (isAuthError(err)) return this.error(err.message, err.code)
            return this.error('Error en verificación de email')
        }
    }

    async requestPasswordReset(params: ResetPasswordInput): Promise<ApiResponse> {
        try {
            const vRes = this.validate<ResetPasswordInput>(params, AuthSchemas.resetPassword)
            if (!vRes.ok) return this.validationError(vRes.alerts)

            await this.service.requestPasswordReset(vRes.data.email)
            return this.success(null, AuthMessages.PASSWORD_RESET_SENT)
        } catch (err) {
            if (isAuthError(err)) return this.error(err.message, err.code)
            return this.error('Error solicitando reset de password')
        }
    }

    async resetPassword(params: ResetPasswordConfirmInput): Promise<ApiResponse> {
        try {
            const vRes = this.validate<ResetPasswordConfirmInput>(
                params,
                AuthSchemas.resetPasswordConfirm
            )
            if (!vRes.ok) return this.validationError(vRes.alerts)

            await this.service.resetPassword(vRes.data.token, vRes.data.newPassword)
            return this.success(null, AuthMessages.PASSWORD_CHANGED)
        } catch (err) {
            if (isAuthError(err)) return this.error(err.message, err.code)
            return this.error('Error cambiando password')
        }
    }
}
`,

    service: () => `import { createHash, randomBytes } from 'node:crypto'
import bcrypt from 'bcryptjs'
import type { ILogger, IConfig } from '../../src/types/core.js'
import { EmailService } from '../../src/email/EmailService.js'
import { AuthRepository, UserRow } from './Auth.Repository.js'
import type { User, RegisterData } from './Auth.Types.js'
import { AuthEmailExistsError, AuthTokenInvalidError } from './Auth.Errors.js'

function sha256Hex(value: string): string {
    return createHash('sha256').update(value, 'utf8').digest('hex')
}

export class AuthService {
    private emailService: EmailService

    constructor(
        private readonly log: ILogger,
        private readonly config: IConfig
    ) {
        this.emailService = new EmailService({ log: this.log, config: this.config })
    }

    async register(data: RegisterData): Promise<User> {
        this.log.show({ type: this.log.TYPE_INFO, msg: 'Creating new user: ' + data.email })

        const exists = await AuthRepository.getUserBaseByEmail(data.email)
        if (exists) {
            throw new AuthEmailExistsError(data.email)
        }

        const hash = await bcrypt.hash(data.password, 10)

        const user = await AuthRepository.insertUser({
            username: data.name ?? null,
            email: data.email,
            passwordHash: hash,
        })

        const sessionProfileId = Number((this.config as any)?.auth?.sessionProfileId ?? 1)
        await AuthRepository.upsertUserProfile({
            userId: user.user_id,
            profileId: sessionProfileId,
        })

        if ((this.config as any)?.auth?.requireEmailVerification) {
            await this.sendVerificationEmail(user.user_id, data.email)
        }

        return this.mapUser({ ...user, user_em: data.email, user_na: data.name, user_pw: hash })
    }

    async requestEmailVerification(identifier: string): Promise<void> {
        let user: UserRow | null = null
        if (identifier.includes('@')) {
            user = await AuthRepository.getUserByEmail(identifier)
        } else {
            user = await AuthRepository.getUserByUsername(identifier)
        }

        if (user && user.user_em) {
            await this.sendVerificationEmail(user.user_id, user.user_em)
        }
    }

    async verifyEmail(token: string): Promise<void> {
        const purpose = String(
            (this.config as any)?.auth?.emailVerificationPurpose ?? 'email_verification'
        )
        const tokenHash = sha256Hex(token)

        const otp = await AuthRepository.getActiveOneTimeCodeForPurposeAndTokenHash({
            purpose,
            tokenHash,
        })

        if (!otp) throw new AuthTokenInvalidError()

        await AuthRepository.setUserEmailVerified(otp.user_id)
        await AuthRepository.consumeOneTimeCode(otp.code_id)
    }

    async requestPasswordReset(email: string): Promise<void> {
        const user = await AuthRepository.getUserByEmail(email)
        if (!user || !user.user_em) return

        const purpose = String((this.config as any)?.auth?.passwordResetPurpose ?? 'password_reset')
        const expiresSeconds = 900

        await AuthRepository.invalidateActivePasswordResetsForUser(user.user_id)

        const token = randomBytes(32).toString('hex')
        const tokenHash = sha256Hex(token)

        await AuthRepository.insertPasswordReset({
            userId: user.user_id,
            tokenHash,
            sentTo: user.user_em,
            expiresSeconds,
        })

        await this.emailService.sendPasswordReset({
            to: user.user_em,
            token,
            code: '000000',
            appName: (this.config as any)?.app?.name,
        })
    }

    async resetPassword(token: string, newPassword: string): Promise<void> {
        const tokenHash = sha256Hex(token)
        const reset = await AuthRepository.getPasswordResetByTokenHash(tokenHash)

        if (!reset || reset.used_at) throw new AuthTokenInvalidError()

        const hash = await bcrypt.hash(newPassword, 10)
        await AuthRepository.updateUserPassword({ userId: reset.user_id, passwordHash: hash })
        await AuthRepository.markPasswordResetUsed(reset.reset_id)
    }

    private async sendVerificationEmail(userId: number, emailAddr: string) {
        const purpose = String(
            (this.config as any)?.auth?.emailVerificationPurpose ?? 'email_verification'
        )
        const expiresSeconds = 900

        const token = randomBytes(32).toString('hex')
        const tokenHash = sha256Hex(token)

        await AuthRepository.insertOneTimeCode({
            userId,
            purpose,
            codeHash: tokenHash,
            expiresSeconds,
            meta: { tokenHash },
        })

        await this.emailService.sendEmailVerification({
            to: emailAddr,
            token,
            code: '000000',
            appName: (this.config as any)?.app?.name,
        })
    }

    private mapUser(row: UserRow): User {
        return {
            userId: row.user_id,
            email: row.user_em!,
            name: row.user_na ?? undefined,
            passwordHash: row.user_pw ?? '',
            isEmailVerified: !!row.email_verified_at,
            isActive: true,
            createdAt: new Date(),
        }
    }
}
`,

    repository: () => `/*
Auth Repository

- DB access helpers used by AuthBO.
- Must align with query names in src/config/queries.json.
*/

import { IDatabase } from '../../src/types/core.js'

// IMPORTANT: This uses global 'db' instance for static methods or injected db.
// Since existing methods use static, we keep it static for now, but cleaner usage is DI.
const db = (globalThis as any).db as IDatabase

export type UserRow = {
    user_id: number
    user_na?: string | null
    user_em?: string | null
    email_verified_at?: string | Date | null
    user_pw?: string | null
    profile_id?: number | null
}

export type OneTimeCodeRow = {
    code_id: number
    user_id: number
    purpose?: string | null
    expires_at?: string | Date | null
    consumed_at?: string | Date | null
    attempt_count?: number | null
    meta?: any
}

export type PasswordResetRow = {
    reset_id: number
    user_id: number
    expires_at?: string | Date | null
    used_at?: string | Date | null
    attempt_count?: number | null
}

export class AuthRepository {
    // --- Users
    static async getUserByEmail(email: string): Promise<UserRow | null> {
        const r = (await db.exe('security', 'getUserByEmail', [email])) as { rows?: UserRow[] }
        return r.rows?.[0] ?? null
    }

    static async getUserByUsername(username: string): Promise<UserRow | null> {
        const r = (await db.exe('security', 'getUserByUsername', [username])) as {
            rows?: UserRow[]
        }
        return r.rows?.[0] ?? null
    }

    static async getUserBaseByEmail(email: string): Promise<UserRow | null> {
        const r = (await db.exe('security', 'getUserBaseByEmail', [email])) as {
            rows?: UserRow[]
        }
        return r.rows?.[0] ?? null
    }

    static async insertUser(params: {
        username: string | null
        email: string | null
        passwordHash: string
    }): Promise<{ user_id: number }> {
        const r = (await db.exe('security', 'insertUser', [params.username, params.email, params.passwordHash])) as {
            rows?: Array<{ user_id: number }>
        }
        const row = r.rows?.[0]
        if (!row?.user_id) throw new Error('insertUser did not return user_id')
        return row
    }

    static async upsertUserProfile({ userId, profileId }: { userId: number; profileId: number }) {
        await db.exe('security', 'upsertUserProfile', [userId, profileId])
        return true
    }

    static async setUserEmailVerified(userId: number) {
        await db.exe('security', 'setUserEmailVerified', [userId])
        return true
    }

    // --- Password reset
    static async insertPasswordReset(params: {
        userId: number
        tokenHash: string
        sentTo: string
        expiresSeconds: number
    }): Promise<void> {
        await db.exe('security', 'insertPasswordReset', [
            params.userId,
            params.tokenHash,
            params.sentTo,
            String(params.expiresSeconds),
            null, // ip
            null, // userAgent
        ])
    }

    static async invalidateActivePasswordResetsForUser(userId: number): Promise<boolean> {
        await db.exe('security', 'invalidateActivePasswordResetsForUser', [userId])
        return true
    }

    static async getPasswordResetByTokenHash(tokenHash: string): Promise<PasswordResetRow | null> {
        const r = (await db.exe('security', 'getPasswordResetByTokenHash', [tokenHash])) as {
            rows?: PasswordResetRow[]
        }
        return r.rows?.[0] ?? null
    }

    static async markPasswordResetUsed(resetId: number): Promise<boolean> {
        await db.exe('security', 'markPasswordResetUsed', [resetId])
        return true
    }

    // --- One-time codes
    static async insertOneTimeCode(params: {
        userId: number
        purpose: string
        codeHash: string
        expiresSeconds: number
        meta?: any
    }): Promise<boolean> {
        await db.exe('security', 'insertOneTimeCode', [
            params.userId,
            params.purpose,
            params.codeHash,
            String(params.expiresSeconds),
            JSON.stringify(params.meta ?? {}),
        ])
        return true
    }

    static async consumeOneTimeCode(codeId: number): Promise<boolean> {
        await db.exe('security', 'consumeOneTimeCode', [codeId])
        return true
    }

    static async getActiveOneTimeCodeForPurposeAndTokenHash(params: {
        purpose: string
        tokenHash: string
    }): Promise<OneTimeCodeRow | null> {
        const r = (await db.exe('security', 'getActiveOneTimeCodeForPurposeAndTokenHash', [
            params.purpose,
            params.tokenHash,
        ])) as { rows?: OneTimeCodeRow[] }
        return r.rows?.[0] ?? null
    }

    static async updateUserPassword(params: { userId: number; passwordHash: string }): Promise<boolean> {
        await db.exe('security', 'updateUserPassword', [params.userId, params.passwordHash])
        return true
    }
}
`,

    schemas: () => `import { z } from 'zod'
import { AuthMessages } from './Auth.Messages.js'

export const AuthSchemas = {
    login: z.object({
        loginId: z.string().min(1, AuthMessages.VALIDATION.LOGIN_ID_REQUIRED),
        password: z.string().min(1, AuthMessages.VALIDATION.PASSWORD_REQUIRED),
    }),

    register: z.object({
        email: z.string().email(AuthMessages.VALIDATION.EMAIL_INVALID),
        password: z.string().min(8, AuthMessages.VALIDATION.PASSWORD_TOO_SHORT),
        name: z.string().optional(),
    }),

    logout: z.object({
        sessionId: z.string().optional(),
    }),

    verifyEmail: z.object({
        token: z.string().min(1, AuthMessages.VALIDATION.TOKEN_REQUIRED),
    }),

    requestEmailVerification: z.object({
        identifier: z.string().min(1, AuthMessages.VALIDATION.EMAIL_REQUIRED),
    }),

    resetPassword: z.object({
        email: z.string().email(AuthMessages.VALIDATION.EMAIL_INVALID),
    }),

    resetPasswordConfirm: z.object({
        token: z.string().min(1, AuthMessages.VALIDATION.TOKEN_REQUIRED),
        newPassword: z.string().min(8, AuthMessages.VALIDATION.PASSWORD_TOO_SHORT),
    }),

    changePassword: z.object({
        currentPassword: z.string().min(1, AuthMessages.VALIDATION.PASSWORD_REQUIRED),
        newPassword: z.string().min(8, AuthMessages.VALIDATION.PASSWORD_TOO_SHORT),
    }),
}

export type LoginInput = z.infer<typeof AuthSchemas.login>
export type RegisterInput = z.infer<typeof AuthSchemas.register>
export type LogoutInput = z.infer<typeof AuthSchemas.logout>
export type VerifyEmailInput = z.infer<typeof AuthSchemas.verifyEmail>
export type RequestEmailVerificationInput = z.infer<typeof AuthSchemas.requestEmailVerification>
export type ResetPasswordInput = z.infer<typeof AuthSchemas.resetPassword>
export type ResetPasswordConfirmInput = z.infer<typeof AuthSchemas.resetPasswordConfirm>
export type ChangePasswordInput = z.infer<typeof AuthSchemas.changePassword>
`,

    types: () => `export interface User {
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

export interface LoginResult {
    user: UserSummary
    session: Session
}

export interface RegisterResult {
    user: UserSummary
    verificationSent: boolean
}
`,

    messages: () => `export const AuthMessages = {
    LOGIN_SUCCESS: 'Sesión iniciada exitosamente',
    LOGOUT_SUCCESS: 'Sesión cerrada exitosamente',
    REGISTER_SUCCESS: 'Usuario registrado exitosamente',
    EMAIL_VERIFIED: 'Email verificado exitosamente',
    PASSWORD_RESET_SENT: 'Enlace de recuperación enviado',
    PASSWORD_CHANGED: 'Contraseña actualizada exitosamente',

    USER_NOT_FOUND: 'Usuario no encontrado',
    INVALID_CREDENTIALS: 'Credenciales inválidas',
    EMAIL_NOT_VERIFIED: 'Email no verificado',
    SESSION_EXPIRED: 'Sesión expirada',
    TOKEN_INVALID: 'Token inválido o expirado',
    EMAIL_ALREADY_EXISTS: 'Ya existe un usuario con este email',
    ACCOUNT_DISABLED: 'Cuenta deshabilitada',

    VALIDATION: {
        LOGIN_ID_REQUIRED: 'El email o usuario es requerido',
        PASSWORD_REQUIRED: 'La contraseña es requerida',
        PASSWORD_TOO_SHORT: 'La contraseña debe tener al menos 8 caracteres',
        EMAIL_REQUIRED: 'El email es requerido',
        EMAIL_INVALID: 'El email no es válido',
        TOKEN_REQUIRED: 'El token es requerido',
    },

    welcomeBack: (name: string) => \`Bienvenido de nuevo, \${name}\`,
    verificationSentTo: (email: string) => \`Se envió verificación a \${email}\`,
}

export type AuthMessageKey = keyof typeof AuthMessages
export type AuthValidationKey = keyof typeof AuthMessages.VALIDATION
`,

    errors: () => `import { AuthMessages } from './Auth.Messages.js'

export class AuthError extends Error {
    readonly tag: string
    readonly code: number
    readonly details?: Record<string, unknown>

    constructor(
        message: string,
        tag: string,
        code: number = 500,
        details?: Record<string, unknown>
    ) {
        super(message)
        this.name = 'AuthError'
        this.tag = tag
        this.code = code
        this.details = details

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, AuthError)
        }
    }

    toJSON() {
        return {
            name: this.name,
            message: this.message,
            tag: this.tag,
            code: this.code,
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
