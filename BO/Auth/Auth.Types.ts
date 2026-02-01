export type UserRow = {
    id: number
    username: string
    email: string
    password_hash: string
    email_verified_at?: string | Date | null
    is_active?: boolean
    profile_id?: number | null
}

export type OneTimeCodeRow = {
    id: number
    user_id: number
    purpose?: string | null
    expires_at?: string | Date | null
    consumed_at?: string | Date | null
    attempt_count?: number | null
    meta?: any
}

export type UserId = {
    id: number // Was user_id
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

export type PasswordResetRow = {
    id: number
    user_id: number
    expires_at?: string | Date | null
    used_at?: string | Date | null
    attempt_count?: number | null
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
