/**
 * AuthPreset - Plantillas para módulo de autenticación
 *
 * Genera la estructura de 7 archivos con nomenclatura Name.Type.ts:
 * - AuthBO.ts
 * - AuthService.ts
 * - AuthRepository.ts
 * - AuthSchemas.ts
 * - AuthTypes.ts
 * - AuthMessages.ts
 * - AuthErrors.ts
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

    bo: () => `import { BaseBO, BODependencies } from '../../src/core/business-objects/BaseBO.js'
import { AuthService } from './AuthService.js'
import {
    AuthSchemas,
    RegisterInput,
    VerifyEmailInput,
    RequestEmailVerificationInput,
    ResetPasswordInput,
    VerifyPasswordResetInput,
    ResetPasswordConfirmInput,
} from './AuthSchemas.js'

import { AuthMessages } from './AuthMessages.js'

export class AuthBO extends BaseBO {
    private service: AuthService

    constructor(deps: BODependencies) {
        super(deps)
        this.service = new AuthService(deps.log, deps.config, deps.db)
    }

    private get authMessages() {
        return this.i18n.use(AuthMessages)
    }

    async register(params: RegisterInput): Promise<ApiResponse> {
        return this.exec<RegisterInput, void>(params, AuthSchemas.register, async (data) => {
            await this.service.register(data)
            return this.created(null, this.authMessages.registerSuccess)
        })
    }

    async verifyEmail(params: VerifyEmailInput): Promise<ApiResponse> {
        return this.exec<VerifyEmailInput, void>(params, AuthSchemas.verifyEmail, async (data) => {
            await this.service.verifyEmail(data.token)
            return this.success(null, this.authMessages.emailVerified)
        })
    }

    async requestEmailVerification(params: RequestEmailVerificationInput): Promise<ApiResponse> {
        return this.exec<RequestEmailVerificationInput, void>(
            params,
            AuthSchemas.requestEmailVerification,
            async (data) => {
                await this.service.requestEmailVerification(data.identifier)
                return this.success(
                    null,
                    this.i18n.format(this.authMessages.verificationSentTo, { email: data.identifier })
                )
            }
        )
    }

    async requestPasswordReset(params: ResetPasswordInput): Promise<ApiResponse> {
        return this.exec<ResetPasswordInput, void>(
            params,
            AuthSchemas.resetPassword,
            async (data) => {
                await this.service.requestPasswordReset(data.email)
                return this.success(null, this.authMessages.passwordResetSent)
            }
        )
    }

    async verifyPasswordReset(params: VerifyPasswordResetInput): Promise<ApiResponse> {
        return this.exec<VerifyPasswordResetInput, void>(
            params,
            AuthSchemas.verifyPasswordReset,
            async (data) => {
                // Just verification of token existence/validity
                await this.service.verifyPasswordResetToken(data.token)
                return this.success(null, this.authMessages.tokenValid)
            }
        )
    }

    async resetPassword(params: ResetPasswordConfirmInput): Promise<ApiResponse> {
        return this.exec<ResetPasswordConfirmInput, void>(
            params,
            AuthSchemas.resetPasswordConfirm,
            async (data) => {
                await this.service.resetPassword(data.token, data.newPassword)
                return this.success(null, this.authMessages.passwordChanged)
            }
        )
    }
}
`,

    service: () => `import { createHash, randomBytes } from 'node:crypto'
import bcrypt from 'bcryptjs'
import { BOService } from '../../src/core/business-objects/BOService.js'
import type { IConfig, IDatabase } from '../../src/types/core.js'
import { EmailService } from '../../src/services/EmailService.js'
import { AuthRepository } from './AuthRepository.js'
import type { User, RegisterData, UserRow } from './AuthTypes.js'
import { AuthEmailExistsError, AuthTokenInvalidError } from './AuthErrors.js'

function sha256Hex(value: string): string {
    return createHash('sha256').update(value, 'utf8').digest('hex')
}

export class AuthService extends BOService {
    private emailService: EmailService
    private repo: AuthRepository

    constructor(log: any, config: IConfig, db: IDatabase) {
        super(log, config, db)
        this.emailService = new EmailService({ log: this.log, config: this.config })
        this.repo = new AuthRepository(db)
    }

    async register(data: RegisterData): Promise<User> {
        this.log.info('Creating new user: ' + data.email)

        const exists = await this.repo.getUserBaseByEmail(data.email)
        if (exists) {
            throw new AuthEmailExistsError(data.email)
        }

        const hash = await bcrypt.hash(data.password, 10)

        const user = await this.repo.insertUser({
            username: data.name ?? null,
            email: data.email,
            passwordHash: hash,
        })

        const sessionProfileId = Number((this.config as any)?.auth?.sessionProfileId ?? 1)
        await this.repo.upsertUserProfile({
            userId: user.user_id,
            profileId: sessionProfileId,
        })

        if ((this.config as any)?.auth?.requireEmailVerification) {
            await this.sendVerificationEmail(user.user_id, data.email)
        }

        return this.mapUser({ ...user, email: data.email, username: data.name, password_hash: hash })
    }

    async requestEmailVerification(identifier: string): Promise<void> {
        let user: UserRow | null = null
        if (identifier.includes('@')) {
            user = await this.repo.getUserByEmail(identifier)
        } else {
            user = await this.repo.getUserByUsername(identifier)
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

        const otp = await this.repo.getActiveOneTimeCodeForPurposeAndTokenHash({
            purpose,
            tokenHash,
        })

        if (!otp) throw new AuthTokenInvalidError()

        await this.repo.setUserEmailVerified(otp.user_id)
        await this.repo.consumeOneTimeCode(otp.code_id)
    }

    async requestPasswordReset(email: string): Promise<void> {
        const user = await this.repo.getUserByEmail(email)
        if (!user || !user.user_em) return

        const purpose = String((this.config as any)?.auth?.passwordResetPurpose ?? 'password_reset')
        const expiresSeconds = 900

        await this.repo.invalidateActivePasswordResetsForUser(user.user_id)

        const token = randomBytes(32).toString('hex')
        const tokenHash = sha256Hex(token)

        await this.repo.insertPasswordReset({
            userId: user.user_id,
            tokenHash,
            sentTo: user.user_em,
            expiresSeconds,
        })

        await this.emailService.sendTemplate({
            to: user.user_em,
            subject: (this.config.app.name ?? 'App') + ': Password Reset',
            templatePath: 'auth/password-reset.html',
            data: {
                appName: this.config.app.name,
                code: '000000',
                token,
            }
        })
    }

    async resetPassword(token: string, newPassword: string): Promise<void> {
        const tokenHash = sha256Hex(token)
        const reset = await this.repo.getPasswordResetByTokenHash(tokenHash)

        if (!reset || reset.used_at) throw new AuthTokenInvalidError()

        const hash = await bcrypt.hash(newPassword, 10)
        await this.repo.updateUserPassword({ userId: reset.user_id, passwordHash: hash })
        await this.repo.markPasswordResetUsed(reset.reset_id)
    }

    async verifyPasswordResetToken(token: string): Promise<void> {
        const tokenHash = sha256Hex(token)
        const reset = await this.repo.getPasswordResetByTokenHash(tokenHash)
        if (!reset || reset.used_at) throw new AuthTokenInvalidError()
    }

    private async sendVerificationEmail(userId: number, emailAddr: string) {
        const purpose = String(
            (this.config as any)?.auth?.emailVerificationPurpose ?? 'email_verification'
        )
        const expiresSeconds = 900

        const token = randomBytes(32).toString('hex')
        const tokenHash = sha256Hex(token)

        await this.repo.insertOneTimeCode({
            userId,
            purpose,
            codeHash: tokenHash,
            expiresSeconds,
            meta: { tokenHash },
        })

        await this.emailService.sendTemplate({
            to: emailAddr,
            subject: ((this.config as any)?.app?.name ?? 'App') + ': Verify your email',
            templatePath: 'auth/email-verification.html',
            data: {
                appName: (this.config as any)?.app?.name,
                code: '000000',
                token,
            }
        })
    }

    private mapUser(row: UserRow): User {
        return {
            userId: row.id,
            email: row.email!,
            name: row.username ?? undefined,
            passwordHash: row.password_hash ?? '',
            isEmailVerified: !!row.email_verified_at,
            isActive: !!row.is_active,
            createdAt: new Date(),
        }
    }
}
`,

    queries: () => `export const AuthQueries = {
    // --- Users
    getUserByEmail: \`
        SELECT u.id, u.username, u.email, u.email_verified_at, u.password_hash, p.profile_id
        FROM security.users u
        LEFT JOIN security.users_profiles p ON u.user_id = p.user_id
        WHERE u.email = $1
    \`,

    getUserByUsername: \`SELECT user_id, user_na, user_em, user_pw, email_verified_at FROM security.users WHERE user_na = $1\`,

    getUserBaseByEmail: \`SELECT user_id, user_na, user_em, user_pw, email_verified_at FROM security.users WHERE user_em = $1\`,

    insertUser: \`
        INSERT INTO security.users (username, email, password_hash)
        VALUES ($1, $2, $3)
        RETURNING id
    \`,

    upsertUserProfile: \`
        INSERT INTO security.user_profiles (user_id, profile_id, assigned_at)
        VALUES ($1, $2, NOW())
        ON CONFLICT (user_id) DO UPDATE SET profile_id = EXCLUDED.profile_id, assigned_at = NOW()
    \`,

    setUserEmailVerified: \`
        UPDATE security.users
        SET email_verified_at = NOW()
        WHERE user_id = $1
    \`,

    updateUserPassword: \`
        UPDATE security.users
        SET user_pw = $2
        WHERE user_id = $1
    \`,

    // --- Password reset
    insertPasswordReset: \`
        INSERT INTO security.password_resets
        (user_id, token_hash, expires_at, created_at, used_at, attempt_count, sent_to, ip_address, user_agent)
        VALUES ($1, $2, NOW() + ($3 || ' seconds')::INTERVAL, NOW(), NULL, 0, $4, $5, $6)
        RETURNING reset_id
    \`,

    invalidateActivePasswordResetsForUser: \`
        UPDATE security.password_resets
        SET used_at = NOW()
        WHERE user_id = $1 AND used_at IS NULL AND expires_at > NOW()
    \`,

    getPasswordResetByTokenHash: \`
        SELECT * FROM security.password_resets
        WHERE token_hash = $1
    \`,

    markPasswordResetUsed: \`
        UPDATE security.password_resets
        SET used_at = NOW()
        WHERE reset_id = $1
    \`,

    // --- One-time codes
    insertOneTimeCode: \`
        INSERT INTO security.one_time_codes
        (user_id, purpose, code_hash, expires_at, created_at, meta)
        VALUES ($1, $2, $3, NOW() + ($4 || ' seconds')::INTERVAL, NOW(), $5)
        RETURNING code_id
    \`,

    consumeOneTimeCode: \`
        UPDATE security.one_time_codes
        SET consumed_at = NOW()
        WHERE code_id = $1
    \`,

    getActiveOneTimeCodeForPurposeAndTokenHash: \`
        SELECT * FROM security.one_time_codes
        WHERE purpose = $1 AND (meta->>'tokenHash') = $2
        AND consumed_at IS NULL AND expires_at > NOW()
        ORDER BY created_at DESC LIMIT 1
    \`,
} as const

export type AuthQueryKey = keyof typeof AuthQueries
`,

    repository: () => `/*
Auth Repository

- DB access helpers used by AuthBO.
- Uses AuthQueries from ./AuthQueries.ts
*/

import { IDatabase } from '../../src/types/core.js'
import { AuthQueries } from './AuthQueries.js'
import { OneTimeCodeRow, PasswordResetRow, UserRow, UserId, UserWithProfileId, PasswordReset, OneTimeCode, InsertUserParams, GetActiveOneTimeCodeParams, UserPasswordResetParams } from './AuthTypes.js'

export class AuthRepository {
    constructor(private db: IDatabase) {}

    // --- Users
    async getUserByEmail(email: string): Promise<UserRow | null> {
        const r = await this.db.query<UserRow>(AuthQueries.getUserByEmail, [email])
        return r.rows[0]
    }

    async getUserByUsername(username: string): Promise<UserRow | null> {
        const r = await this.db.query<UserRow>(AuthQueries.getUserByUsername, [username])
        return r.rows[0]
    }

    async getUserBaseByEmail(email: string): Promise<UserRow | null> {
        const r = await this.db.query<UserRow>(AuthQueries.getUserBaseByEmail, [email])
        return r.rows[0]
    }

    async insertUser(params: InsertUserParams): Promise<UserId> {
        const r = await this.db.query<UserId>(AuthQueries.insertUser, [
            params.username,
            params.email,
            params.passwordHash,
        ])
        const row = r.rows[0]
        if (!row.id) throw new Error('insertUser did not return id')
        return row
    }

    async upsertUserProfile(params: UserWithProfileId) {
        await this.db.query<UserId>(AuthQueries.upsertUserProfile, [params.userId, params.profileId])
        return true
    }

    async setUserEmailVerified(userId: number) {
        await this.db.query<UserId>(AuthQueries.setUserEmailVerified, [userId])
        return true
    }

    // --- Password reset
    async insertPasswordReset(params: PasswordReset): Promise<void> {
        await this.db.query<UserId>(AuthQueries.insertPasswordReset, [
            params.userId,
            params.tokenHash,
            params.sentTo,
            String(params.expiresSeconds),
            null, // ip
            null, // userAgent
        ])
    }

    async invalidateActivePasswordResetsForUser(userId: number): Promise<boolean> {
        await this.db.query<UserId>(AuthQueries.invalidateActivePasswordResetsForUser, [userId])
        return true
    }

    async getPasswordResetByTokenHash(tokenHash: string): Promise<PasswordResetRow | null> {
        const r = await this.db.query<PasswordResetRow>(AuthQueries.getPasswordResetByTokenHash, [tokenHash])
        return r.rows[0]
    }

    async markPasswordResetUsed(resetId: number): Promise<boolean> {
        await this.db.query<UserId>(AuthQueries.markPasswordResetUsed, [resetId])
        return true
    }

    // --- One-time codes
    async insertOneTimeCode(params: OneTimeCode): Promise<boolean> {
        await this.db.query<UserId>(AuthQueries.insertOneTimeCode, [
            params.userId,
            params.purpose,
            params.codeHash,
            String(params.expiresSeconds),
            JSON.stringify(params.meta ?? {}),
        ])
        return true
    }

    async consumeOneTimeCode(codeId: number): Promise<boolean> {
        await this.db.query<UserId>(AuthQueries.consumeOneTimeCode, [codeId])
        return true
    }

    async getActiveOneTimeCodeForPurposeAndTokenHash(params: GetActiveOneTimeCodeParams): Promise<OneTimeCodeRow | null> {
        const r = await this.db.query<OneTimeCodeRow>(AuthQueries.getActiveOneTimeCodeForPurposeAndTokenHash, [
            params.purpose,
            params.tokenHash,
        ])
        return r.rows[0]
    }

    async updateUserPassword(params: UserPasswordResetParams): Promise<boolean> {
        await this.db.query<UserId>(AuthQueries.updateUserPassword, [params.userId, params.passwordHash])
        return true
    }
}
`,

    schemas: () => `import { z } from 'zod'

export const AuthSchemas = {
    login: z.object({
        identifier: z.string().min(1, 'bo.auth.validation.loginIdRequired'),
        password: z.string().min(1, 'bo.auth.validation.passwordRequired'),
    }),

    register: z.object({
        email: z.string().email('bo.auth.validation.emailInvalid'),
        password: z.string().min(8, 'bo.auth.validation.passwordTooShort'),
        name: z.string().optional(),
    }),

    logout: z.object({
        sessionId: z.string().optional(),
    }),

    verifyEmail: z.object({
        token: z.string().min(1, 'bo.auth.validation.tokenRequired'),
    }),

    requestEmailVerification: z.object({
        identifier: z.string().min(1, 'bo.auth.validation.emailRequired'),
    }),

    resetPassword: z.object({
        email: z.string().email('bo.auth.validation.emailInvalid'),
    }),

    verifyPasswordReset: z.object({
        token: z.string().min(1, 'bo.auth.validation.tokenRequired'),
    }),

    resetPasswordConfirm: z.object({
        token: z.string().min(1, 'bo.auth.validation.tokenRequired'),
        newPassword: z.string().min(8, 'bo.auth.validation.passwordTooShort'),
    }),

    changePassword: z.object({
        currentPassword: z.string().min(1, 'bo.auth.validation.passwordRequired'),
        newPassword: z.string().min(8, 'bo.auth.validation.passwordTooShort'),
    }),
}

export type LoginInput = z.infer<typeof AuthSchemas.login>
export type RegisterInput = z.infer<typeof AuthSchemas.register>
export type LogoutInput = z.infer<typeof AuthSchemas.logout>
export type VerifyEmailInput = z.infer<typeof AuthSchemas.verifyEmail>
export type RequestEmailVerificationInput = z.infer<typeof AuthSchemas.requestEmailVerification>
export type ResetPasswordInput = z.infer<typeof AuthSchemas.resetPassword>
export type VerifyPasswordResetInput = z.infer<typeof AuthSchemas.verifyPasswordReset>
export type ResetPasswordConfirmInput = z.infer<typeof AuthSchemas.resetPasswordConfirm>
export type ChangePasswordInput = z.infer<typeof AuthSchemas.changePassword>
`,

    types: () => `// ============================================================
// Tipos de Fila (Database Rows)
// ============================================================

export type UserRow = {
    id: number
    username?: string | null
    email?: string | null
    email_verified_at?: string | Date | null
    password_hash?: string | null
    profile_id?: number | null
    is_active?: boolean | null
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

// ============================================================
// Parámetros de Operación (Repository Params)
// ============================================================

export type UserId = {
    user_id: number
}

export type UserWithProfileId = {
    userId: number
    profileId: number
}

export type InsertUserParams = {
    username: string | null
    email: string | null
    passwordHash: string
}

export type UserPasswordResetParams = {
    userId: number
    passwordHash: string
}

export type PasswordReset = {
    userId: number
    tokenHash: string
    sentTo: string
    expiresSeconds: number
}

export type OneTimeCode = {
    userId: number
    purpose: string
    codeHash: string
    expiresSeconds: number
    meta?: any
}

export type GetActiveOneTimeCodeParams = {
    purpose: string
    tokenHash: string
}

// ============================================================
// Tipos de Entidad (Business Objects)
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

// ============================================================
// Tipos de Entrada (API Inputs/DTOs)
// ============================================================

export interface RegisterData {
    email: string
    password: string
    name?: string
}

export interface PasswordResetData {
    token: string
    newPassword: string
}

export interface UserCredentials {
    loginId: string
    password: string
}

// ============================================================
// Otros (Tokens / Sesiones / Resultados)
// ============================================================

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
    es: {
        loginSuccess: 'Sesión iniciada exitosamente',
        logoutSuccess: 'Sesión cerrada exitosamente',
        registerSuccess: 'Usuario registrado exitosamente',
        emailVerified: 'Email verificado exitosamente',
        passwordResetSent: 'Enlace de recuperación enviado',
        passwordChanged: 'Contraseña actualizada exitosamente',
        verificationSent: 'Enlace de verificación enviado',
        tokenValid: 'Token válido',
        userNotFound: 'Usuario no encontrado',
        invalidCredentials: 'Credenciales inválidas',
        emailNotVerified: 'Email no verificado',
        sessionExpired: 'Sesión expirada',
        tokenInvalid: 'Token inválido o expirado',
        emailAlreadyExists: 'Ya existe un usuario con este email',
        accountDisabled: 'Cuenta deshabilitada',
        validation: {
            loginIdRequired: 'El email o usuario es requerido',
            passwordRequired: 'La contraseña es requerida',
            passwordTooShort: 'La contraseña debe tener al menos 8 caracteres',
            emailRequired: 'El email es requerido',
            emailInvalid: 'El email no es válido',
            tokenRequired: 'El token es requerido',
        },
        welcomeBack: 'Bienvenido de nuevo, {name}',
        verificationSentTo: 'Se envió verificación a {email}',
    },
    en: {
        loginSuccess: 'Login successful',
        logoutSuccess: 'Logout successful',
        registerSuccess: 'User registered successfully',
        emailVerified: 'Email verified successfully',
        passwordResetSent: 'Recovery link sent',
        passwordChanged: 'Password updated successfully',
        verificationSent: 'Verification link sent',
        tokenValid: 'Valid token',
        userNotFound: 'User not found',
        invalidCredentials: 'Invalid credentials',
        emailNotVerified: 'Email not verified',
        sessionExpired: 'Session expired',
        tokenInvalid: 'Invalid or expired token',
        emailAlreadyExists: 'A user with this email already exists',
        accountDisabled: 'Account disabled',
        validation: {
            loginIdRequired: 'Email or username is required',
            passwordRequired: 'Password is required',
            passwordTooShort: 'Password must be at least 8 characters',
            emailRequired: 'Email is required',
            emailInvalid: 'Email is invalid',
            tokenRequired: 'Token is required',
        },
        welcomeBack: 'Welcome back, {name}',
        verificationSentTo: 'Verification sent to {email}',
    },
}
`,

    errors: () => `import { BOError } from '../../src/core/business-objects/BOError.js'

export class AuthError extends BOError {
    constructor(
        message: string,
        tag: string,
        code: number = 500,
        details?: Record<string, unknown>
    ) {
        super(message, tag, code, details)
        this.name = 'AuthError'
    }
}

export class AuthNotFoundError extends AuthError {
    constructor() {
        super('bo.auth.userNotFound', 'AUTH_USER_NOT_FOUND', 404)
        this.name = 'AuthNotFoundError'
    }
}

export class AuthInvalidCredentialsError extends AuthError {
    constructor() {
        super('bo.auth.invalidCredentials', 'AUTH_INVALID_CREDENTIALS', 401)
        this.name = 'AuthInvalidCredentialsError'
    }
}

export class AuthEmailNotVerifiedError extends AuthError {
    constructor() {
        super('bo.auth.emailNotVerified', 'AUTH_EMAIL_NOT_VERIFIED', 403)
        this.name = 'AuthEmailNotVerifiedError'
    }
}

export class AuthSessionExpiredError extends AuthError {
    constructor() {
        super('bo.auth.sessionExpired', 'AUTH_SESSION_EXPIRED', 401)
        this.name = 'AuthSessionExpiredError'
    }
}

export class AuthTokenInvalidError extends AuthError {
    constructor() {
        super('bo.auth.tokenInvalid', 'AUTH_TOKEN_INVALID', 400)
        this.name = 'AuthTokenInvalidError'
    }
}

export class AuthEmailExistsError extends AuthError {
    constructor(email?: string) {
        super('bo.auth.emailAlreadyExists', 'AUTH_EMAIL_EXISTS', 409, { email })
        this.name = 'AuthEmailExistsError'
    }
}

export class AuthAccountDisabledError extends AuthError {
    constructor() {
        super('bo.auth.accountDisabled', 'AUTH_ACCOUNT_DISABLED', 403)
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
