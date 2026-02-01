export const SessionQueries = {
    getUserByEmail: `
        SELECT u.id, u.username, u.email, u.email_verified_at, u.password_hash, p.profile_id
        FROM security.users u
        LEFT JOIN security.user_profiles p ON u.id = p.user_id 
        WHERE u.email = $1
    `,
    getUserByUsername: `
        SELECT u.id, u.username, u.email, u.password_hash, u.email_verified_at, p.profile_id
        FROM security.users u
        LEFT JOIN security.user_profiles p ON u.id = p.user_id 
        WHERE u.username = $1
    `,
    updateUserLastLogin: `
        UPDATE security.users SET last_login_at = NOW(), updated_at = NOW() WHERE id = $1
    `,
}