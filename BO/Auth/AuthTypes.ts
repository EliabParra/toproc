export type UserRow = {
    user_id: number
    user_na?: string | null
    user_em?: string | null
    email_verified_at?: string | Date | null
    user_pw?: string | null
    profile_id?: number | null
}

export type UserBaseRow = {
    user_id: number
    user_na?: string | null
    user_em?: string | null
    email_verified_at?: string | Date | null
}

export type PasswordResetRow = {
    reset_id: number
    user_id: number
    expires_at?: string | Date | null
    used_at?: string | Date | null
    attempt_count?: number | null
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

// Request Types (extracted from AuthBO)
export type RegisterParams = {
    username?: unknown
    email?: unknown
    password?: unknown
}

export type VerifyEmailParams = {
    token?: unknown
    code?: unknown
}

export type PasswordResetParams = {
    identifier?: unknown // email or username
    token?: unknown
    code?: unknown
    newPassword?: unknown
}
