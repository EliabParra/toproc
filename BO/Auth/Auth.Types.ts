/**
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

export interface VerifyEmailData {
    token: string
}

export interface RequestPasswordResetData {
    email: string
}

export interface ResetPasswordConfirmData {
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
