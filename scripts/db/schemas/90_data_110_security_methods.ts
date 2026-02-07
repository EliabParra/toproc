/**
 * Auto-generated data for security.methods
 * Generated at: 2026-02-07T18:27:04.724Z
 */
export const DATA_METHODS_SCHEMA = [
    `INSERT INTO security.methods (id, object_id, name, tx) VALUES ('1', '1', 'register', 1) ON CONFLICT (id) DO UPDATE SET object_id = EXCLUDED.object_id, name = EXCLUDED.name, tx = EXCLUDED.tx;`,
    `INSERT INTO security.methods (id, object_id, name, tx) VALUES ('2', '1', 'verifyEmail', 2) ON CONFLICT (id) DO UPDATE SET object_id = EXCLUDED.object_id, name = EXCLUDED.name, tx = EXCLUDED.tx;`,
    `INSERT INTO security.methods (id, object_id, name, tx) VALUES ('3', '1', 'requestEmailVerification', 3) ON CONFLICT (id) DO UPDATE SET object_id = EXCLUDED.object_id, name = EXCLUDED.name, tx = EXCLUDED.tx;`,
    `INSERT INTO security.methods (id, object_id, name, tx) VALUES ('4', '1', 'requestPasswordReset', 4) ON CONFLICT (id) DO UPDATE SET object_id = EXCLUDED.object_id, name = EXCLUDED.name, tx = EXCLUDED.tx;`,
    `INSERT INTO security.methods (id, object_id, name, tx) VALUES ('5', '1', 'verifyPasswordReset', 5) ON CONFLICT (id) DO UPDATE SET object_id = EXCLUDED.object_id, name = EXCLUDED.name, tx = EXCLUDED.tx;`,
    `INSERT INTO security.methods (id, object_id, name, tx) VALUES ('6', '1', 'resetPassword', 6) ON CONFLICT (id) DO UPDATE SET object_id = EXCLUDED.object_id, name = EXCLUDED.name, tx = EXCLUDED.tx;`,
]
