import { IAuditService, IDatabase, ILogger } from '../types/core.js'
import { redactSecrets } from '../utils/sanitize.js'

export type AuditArgs = {
    action: string
    objectName?: string | null
    methodName?: string | null
    tx?: unknown
    user_id?: number | null
    profile_id?: number | null
    details?: Record<string, unknown>
}

const AuditQueries = {
    insertAuditLog: `
        INSERT INTO security.audit_logs 
        (request_id, user_id, profile_id, action, object_name, method_name, tx, details)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)
    `,
}

/**
 * Servicio de Auditoría.
 *
 * Registra eventos de seguridad y negocio de manera asíncrona (Best Effort).
 * Sanitiza automáticamente los datos para no registrar secretos/PII.
 */
export class AuditService implements IAuditService {
    private db: IDatabase
    private logger: ILogger

    constructor(deps: { db: IDatabase, logger: ILogger }) {
        this.db = deps.db
        this.logger = deps.logger
    }

    async log(req: any, args: AuditArgs): Promise<void> {
        const {
            action,
            objectName = null,
            methodName = null,
            tx = null,
            user_id = req?.session?.user_id ?? null,
            profile_id = req?.session?.profile_id ?? null,
            details = {},
        } = args ?? ({} as AuditArgs)

        try {
            const safeDetails = redactSecrets((details ?? {}) as Record<string, unknown>)

            await this.db.query(AuditQueries.insertAuditLog, [
                req?.requestId,
                user_id,
                profile_id,
                action,
                objectName,
                methodName,
                tx,
                JSON.stringify(safeDetails),
            ])
        } catch (err) {
            this.logger.show({
                type: this.logger.TYPE_ERROR,
                msg: 'Error al registrar auditoría',
                ctx: err,
            })
        }
    }
}
