/**
 * Auto-generated data for security.profiles
 * Generated at: 2026-02-07T18:27:04.768Z
 */
export const DATA_PROFILES_SCHEMA = [
    `INSERT INTO security.profiles (id, name) VALUES ('1', 'public') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;`,
]
