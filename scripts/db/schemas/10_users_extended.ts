/**
 * Users Extended Schema
 * Additional columns for user management (email, verification, etc.)
 */
export const USERS_EXTENDED_SCHEMA = [
    // Email support
    `alter table security.users add column if not exists email text;`,
    `alter table security.users add column if not exists email_verified_at timestamptz;`,
    `create unique index if not exists uq_users_email on security.users(email) where email is not null;`,

    // Sessions table (for express-session)
    `create table if not exists security.sessions (
        sid varchar not null primary key,
        sess json not null,
        expire timestamp(6) not null
    );`,
    `create index if not exists ix_sessions_expire on security.sessions(expire);`,
]
