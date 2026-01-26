export type RegisterParams = {
    username?: string
    email?: string
    password?: string
}

export type UserRow = {
    user_id: number
    user_na: string
    user_em: string
    email_verified_at: Date | null
    user_pw?: string
}

export type UserBaseRow = {
    user_id: number
    user_na: string
    user_em: string
    email_verified_at: Date | null
}

export type UserProfileRow = {
    user_id: number
    profile_id: number
}

// Ensure these types align with what Repository expects
export type OneTimeCodeRow = {
    code_id: number
    user_id: number
    purpose: string
    code_hash: string
    expires_at: Date | string
    consumed_at: Date | string | null
    attempt_count: number
    meta: any
}

export type PasswordResetRow = {
    reset_id: number
    user_id: number
    token_hash: string
    expires_at: Date | string
    used_at: Date | string | null
    attempt_count: number
}
