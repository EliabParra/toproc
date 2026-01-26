import { IAuditService, IDatabase } from '../types/core.js'
import { redactSecrets } from '../helpers/sanitize.js'

export type AuditArgs = {
    action: string
    object_na?: string | null
    method_na?: string | null
    tx?: unknown
    user_id?: number | null
    profile_id?: number | null
    details?: Record<string, unknown>
}

/**
 * Servicio de Auditoría.
 *
 * Registra eventos de seguridad y negocio de manera asíncrona (Best Effort).
 * Sanitiza automáticamente los datos para no registrar secretos/PII.
 */
export class AuditService implements IAuditService {
    private db: IDatabase

    constructor(deps: { db: IDatabase }) {
        this.db = deps.db
    }

    async log(req: any, args: AuditArgs): Promise<void> {
        const {
            action,
            object_na = null,
            method_na = null,
            tx = null,
            user_id = req?.session?.user_id ?? null,
            profile_id = req?.session?.profile_id ?? null,
            details = {},
        } = args ?? ({} as AuditArgs)

        try {
            const safeDetails = redactSecrets((details ?? {}) as Record<string, unknown>)

            await this.db.exe('security', 'insertAuditLog', [
                req?.requestId,
                user_id,
                profile_id,
                action,
                object_na,
                method_na,
                tx,
                JSON.stringify(safeDetails),
            ])
        } catch (err) {
            // Audit logging is best-effort, suppress errors but maybe we should log to console if debugging?
            // For now keep it silent as per original `auditBestEffort` design.
        }
    }
}
