/**
 * Auto-generated data for security.users
 * Generated at: 2026-02-07T18:27:04.804Z
 */
export const DATA_USERS_SCHEMA = [
    `INSERT INTO security.users (id, username, password_hash, profile_id, is_active, created_at, updated_at, last_login_at, email, email_verified_at) VALUES ('1', 'admin', '$2b$10$8T.rwVF5YCDjqRc3oeYX2.t.8fDRK1R1FOAz7REW3KS9GZQj3v3km', '1', TRUE, '2026-02-07T18:26:49.649Z', '2026-02-07T18:26:49.649Z', NULL, NULL, NULL) ON CONFLICT (id) DO UPDATE SET username = EXCLUDED.username, password_hash = EXCLUDED.password_hash, profile_id = EXCLUDED.profile_id, is_active = EXCLUDED.is_active, created_at = EXCLUDED.created_at, updated_at = EXCLUDED.updated_at, last_login_at = EXCLUDED.last_login_at, email = EXCLUDED.email, email_verified_at = EXCLUDED.email_verified_at;`,
]
