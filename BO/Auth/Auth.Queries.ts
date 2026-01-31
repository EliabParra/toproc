export const AuthQueries = {
    // --- Users
    getUserByEmail: `
        SELECT u.user_id, u.user_na, u.user_em, u.email_verified_at, u.user_pw, p.profile_id
        FROM security.users u
        LEFT JOIN security.users_profiles p ON u.user_id = p.user_id
        WHERE u.user_em = $1
    `,

    getUserByUsername: `SELECT user_id, user_na, user_em, user_pw, email_verified_at FROM security.users WHERE user_na = $1`,

    getUserBaseByEmail: `SELECT user_id, user_na, user_em, user_pw, email_verified_at FROM security.users WHERE user_em = $1`,

    insertUser: `
        INSERT INTO security.users (user_na, user_em, user_pw)
        VALUES ($1, $2, $3)
        RETURNING user_id
    `,

    upsertUserProfile: `
        INSERT INTO security.user_profiles (user_id, profile_id, assigned_at)
        VALUES ($1, $2, NOW())
        ON CONFLICT (user_id) DO UPDATE SET profile_id = EXCLUDED.profile_id, assigned_at = NOW()
    `,

    setUserEmailVerified: `
        UPDATE security.users
        SET email_verified_at = NOW()
        WHERE user_id = $1
    `,

    updateUserPassword: `
        UPDATE security.users
        SET user_pw = $2
        WHERE user_id = $1
    `,

    // --- Password reset
    insertPasswordReset: `
        INSERT INTO security.password_resets 
        (user_id, token_hash, expires_at, created_at, used_at, attempt_count, sent_to, ip_address, user_agent)
        VALUES ($1, $2, NOW() + ($3 || ' seconds')::INTERVAL, NOW(), NULL, 0, $4, $5, $6)
        RETURNING reset_id
    `,

    invalidateActivePasswordResetsForUser: `
        UPDATE security.password_resets
        SET used_at = NOW()
        WHERE user_id = $1 AND used_at IS NULL AND expires_at > NOW()
    `,

    getPasswordResetByTokenHash: `
        SELECT * FROM security.password_resets 
        WHERE token_hash = $1
    `,

    markPasswordResetUsed: `
        UPDATE security.password_resets
        SET used_at = NOW()
        WHERE reset_id = $1
    `,

    // --- One-time codes
    insertOneTimeCode: `
        INSERT INTO security.one_time_codes
        (user_id, purpose, code_hash, expires_at, created_at, meta)
        VALUES ($1, $2, $3, NOW() + ($4 || ' seconds')::INTERVAL, NOW(), $5)
        RETURNING code_id
    `,

    consumeOneTimeCode: `
        UPDATE security.one_time_codes
        SET consumed_at = NOW()
        WHERE code_id = $1
    `,

    getActiveOneTimeCodeForPurposeAndTokenHash: `
        SELECT * FROM security.one_time_codes
        WHERE purpose = $1 AND (meta->>'tokenHash') = $2
        AND consumed_at IS NULL AND expires_at > NOW()
        ORDER BY created_at DESC LIMIT 1
    `,
} as const

export type AuthQueryKey = keyof typeof AuthQueries
