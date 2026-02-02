import {
    ITransactionMapper,
    ITransactionExecutor,
    ILogger,
    IAuditService,
    II18nService,
    AppMessages,
    ISecurityContext,
} from '../../types/index.js'
import { AuthorizationService } from '../security/AuthorizationService.js'

/**
 * Orquestador de Transacciones.
 *
 * Coordina el flujo completo de una petición de negocio:
 * 1. Resolución (Mapper): TX -> Ruta
 * 2. Autorización (AuthZ): Perfil -> Permiso
 * 3. Validación (Security): Input Sanitization & Path Traversal Checks
 * 4. Ejecución (Executor): Invocación del BO
 * 5. Auditoría (Audit): Registro del resultado
 *
 * @class TransactionOrchestrator
 */
export class TransactionOrchestrator {
    private readonly validNameRegex = /^[a-zA-Z0-9]+$/
    constructor(
        private mapper: ITransactionMapper,
        private auth: AuthorizationService,
        private executor: ITransactionExecutor,
        private log: ILogger,
        private audit: IAuditService,
        private i18n: II18nService
    ) {
        this.log = log.child({ category: 'TransactionOrchestrator' })
    }

    /**
     * Ejecuta una transacción completa de forma segura.
     *
     * @param tx - Código de transacción
     * @param context - Contexto de seguridad del usuario actual
     * @param params - Parámetros de entrada
     * @returns Resultado de la ejecución
     * @throws {Error} Si falla autorización, validación o ejecución
     */
    async execute(
        tx: unknown,
        context: ISecurityContext,
        params: Record<string, unknown>
    ): Promise<unknown> {
        // 1. Resolución
        const route = this.mapper.resolve(tx)
        if (!route) {
            return this.errorResponse('server.serverError', 500, 'Transaction not found')
        }

        const { objectName, methodName } = route

        // 2. Validación Estricta de Rutas (Anti-Path Traversal / Lista Blanca)
        if (!this.validNameRegex.test(objectName) || !this.validNameRegex.test(methodName)) {
            await this.auditLog(context, 'INVALID_PATH', route, {
                error: 'Invalid characters in route',
            })
            return this.errorResponse('server.serverError', 400, 'Invalid Transaction Route')
        }

        // 3. Autorización
        if (!this.auth.isAuthorized(context.profileId, objectName, methodName)) {
            await this.auditLog(context, 'ACCESS_DENIED', route)
            return this.errorResponse('auth.noPrivileges', 403)
        }

        // 4. Ejecución
        try {
            const start = Date.now()

            // Inyectar contexto de seguridad en params (sin sobrescribir si no se desea,
            // pero idealmente el BO debería recibir el contexto aparte.
            // Por compatibilidad actual, lo mezclamos o lo pasamos como propiedad oculta/especial
            // si el BO lo soporta, o confiamos en que 'session' en BO dependencies tiene lo necesario.
            // Para este refactor mantenemos params como están).

            const result = await this.executor.execute(objectName, methodName, params)

            await this.auditLog(context, 'EXECUTE_SUCCESS', route, {
                durationMs: Date.now() - start,
            })
            return result
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err)
            this.log.error(`Transaction execution failed: ${msg}`, { tx, objectName, methodName })
            await this.auditLog(context, 'EXECUTE_ERROR', route, { error: msg })
            return this.errorResponse('server.serverError', 500)
        }
    }

    private errorResponse(
        key: keyof AppMessages['errors']['server'] | string,
        code: number,
        logMsg?: string
    ) {
        if (logMsg) this.log.error(logMsg)

        // Uso simplificado de i18n error para mantener compatibilidad con respuesta API
        // Asumimos que i18n.error puede resolver keys
        const err = this.i18n.error(key as any)
        return { ...err, code }
    }

    private async auditLog(
        context: ISecurityContext,
        action: string,
        route: { objectName: string; methodName: string },
        details?: Record<string, unknown>
    ) {
        try {
            await this.audit.log({ headers: {}, ip: 'internal' } as any, {
                // Mock Request para audit compatible
                action,
                user_id: context.userId,
                profile_id: context.profileId,
                objectName: route.objectName,
                methodName: route.methodName,
                details,
            })
        } catch (e) {
            this.log.error('Failed to audit log', e as Error)
        }
    }
}
