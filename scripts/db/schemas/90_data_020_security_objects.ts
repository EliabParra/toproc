/**
 * Auto-generated data for security.objects
 * Generated at: 2026-02-07T18:27:04.735Z
 */
export const DATA_OBJECTS_SCHEMA = [
    `INSERT INTO security.objects (id, name) VALUES ('1', 'Auth') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;`,
]
