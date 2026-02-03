export const AuthQueries = {
    // --- Users
    getUserByEmail: `
        SELECT u.id, u.username, u.email, u.email_verified_at, u.password_hash, p.profile_id
        FROM security.users u
        LEFT JOIN security.user_profiles p ON u.id = p.user_id
        WHERE u.email = $1
    `,

    getUserByUsername: `SELECT id, username, email, password_hash, email_verified_at FROM security.users WHERE username = $1`,

    getUserBaseByEmail: `SELECT id, username, email, password_hash, email_verified_at FROM security.users WHERE email = $1`,

    insertUser: `
        INSERT INTO security.users (username, email, password_hash)
        VALUES ($1, $2, $3)
        RETURNING id
    `,

    upsertUserProfile: `
        INSERT INTO security.user_profiles (user_id, profile_id, assigned_at)
        VALUES ($1, $2, NOW())
        ON CONFLICT (user_id, profile_id) DO UPDATE SET assigned_at = NOW()
    `,

    setUserEmailVerified: `
        UPDATE security.users
        SET email_verified_at = NOW()
        WHERE id = $1
    `,

    updateUserPassword: `
        UPDATE security.users
        SET password_hash = $2
        WHERE id = $1
    `,

    // --- Password reset
    insertPasswordReset: `
        INSERT INTO security.password_resets
        (user_id, token_hash, expires_at, created_at, used_at, attempt_count, token_sent_to, request_ip, user_agent)
        VALUES ($1, $2, NOW() + ($3 || ' seconds')::INTERVAL, NOW(), NULL, 0, $4, $5, $6)
        RETURNING id
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
        WHERE id = $1
    `,

    // --- One-time codes
    insertOneTimeCode: `
        INSERT INTO security.one_time_codes
        (user_id, purpose, code_hash, expires_at, created_at, meta)
        VALUES ($1, $2, $3, NOW() + ($4 || ' seconds')::INTERVAL, NOW(), $5)
        RETURNING id
    `,

    consumeOneTimeCode: `
        UPDATE security.one_time_codes
        SET consumed_at = NOW()
        WHERE id = $1
    `,

    getActiveOneTimeCodeForPurposeAndTokenHash: `
        SELECT * FROM security.one_time_codes
        WHERE purpose = $1 AND (meta->>'tokenHash') = $2
        AND consumed_at IS NULL AND expires_at > NOW()
        ORDER BY created_at DESC LIMIT 1
    `,
} as const

export type AuthQueryKey = keyof typeof AuthQueries
