export const AuditQueries = {
    insertAuditLog: `
        INSERT INTO security.audit_logs 
        (request_id, user_id, profile_id, action, object_name, method_name, tx, details)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)
    `,
}