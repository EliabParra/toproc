import type { IAuditService, IDatabase, ILogger, AppRequest } from '../types/index.js'
import { redactSecrets } from '../utils/sanitize.js'
import { AuditQueries } from './queries/audit.js'

export type AuditArgs = {
    action: string
    objectName?: string | null
    methodName?: string | null
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
    private logger: ILogger

    constructor(deps: { db: IDatabase; log: ILogger }) {
        this.db = deps.db
        this.logger = deps.log.child({ category: 'Audit' })
    }

    async log(req: AppRequest, args: AuditArgs): Promise<void> {
        const {
            action,
            objectName = null,
            methodName = null,
            tx = null,
            user_id = req?.session?.userId ?? null,
            profile_id = req?.session?.profileId ?? null,
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
            this.logger.error('Error al registrar auditoría', err as Error)
        }
    }
}
