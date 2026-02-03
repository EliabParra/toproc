import type {
    BODependencies,
    IAuditService,
    IConfig,
    IDatabase,
    IEmailService,
    II18nService,
    ILogger,
    ISecurityService,
    ISessionService,
    IValidator,
} from '../types/index.js'
import { TransactionMapper } from '../core/transaction/TransactionMapper.js'
import { PermissionGuard } from '../core/security/PermissionGuard.js'
import { TransactionExecutor } from '../core/transaction/TransactionExecutor.js'

/**
 * Servicio de seguridad y orquestador principal del framework.
 *
 * Responsable de coordinar el flujo de transacción:
 * 1. Inicializa componentes (Mapper, Guard, Executor)
 * 2. Mapea códigos de transacción (tx) a métodos (TransactionMapper)
 * 3. Verifica permisos de acceso (PermissionGuard)
 * 4. Ejecuta la lógica de negocio (TransactionExecutor)
 *
 * @example
 * ```typescript
 * const security = new SecurityService({ db, log, config, i18n, audit, session, validator })
 * await security.init() // Carga permisos y mapeos
 *
 * // Uso típico en Dispatcher:
 * const route = security.getDataTx('TX_CODE')
 * if (security.getPermissions({ profile_id: 1, ...route })) {
 *   const result = await security.executeMethod({ ...route, params })
 * }
 * ```
 */
export class SecurityService implements ISecurityService {
    private mapper: TransactionMapper
    private guard: PermissionGuard
    private executor: TransactionExecutor

    // config/i18n/log needed for error handling/responses
    private config: IConfig
    private i18n: II18nService
    private log: ILogger

    /** Indica si el sistema de seguridad ha cargado correctamente */
    public isReady: boolean = false
    /** Promesa que resuelve cuando la inicialización completa */
    public ready!: Promise<boolean>

    /**
     * Crea una instancia de SecurityService.
     *
     * @param deps - Dependencias de infraestructura
     */
    constructor(deps: {
        db: IDatabase
        log: ILogger
        config: IConfig
        i18n: II18nService
        audit: IAuditService
        session: ISessionService
        validator: IValidator
        email: IEmailService
    }) {
        this.log = deps.log.child({ category: 'Security' })
        this.config = deps.config
        this.i18n = deps.i18n

        // Initialize sub-components
        this.mapper = new TransactionMapper(deps.db, deps.log)
        this.guard = new PermissionGuard(deps.db, deps.log)

        // Construct BO Dependencies package (injecting self as security)
        const boDeps: BODependencies = {
            db: deps.db,
            log: deps.log,
            config: deps.config,
            audit: deps.audit,
            session: deps.session,
            validator: deps.validator,
            security: this,
            i18n: deps.i18n,
            email: deps.email,
        }
        this.executor = new TransactionExecutor(boDeps)
    }

    /**
     * Inicializa los subsistemas de seguridad (Mapper y Guard).
     * Carga permisos y mapeos desde la base de datos.
     *
     * @returns {Promise<boolean>} True si la inicialización fue exitosa
     * @throws {Error} Si falla la carga de datos iniciales
     */
    async init(): Promise<boolean> {
        if (this.ready) return this.ready

        this.ready = (async () => {
            try {
                await Promise.all([this.guard.load(), this.mapper.load()])
                this.isReady = true
                return true
            } catch (err: unknown) {
                this.log.error(
                    `${this.i18n.messages.errors.server.serverError.msg}, SecurityService.init: ${err instanceof Error ? err.message : String(err)}`,
                    err as Error
                )
                throw err
            }
        })()

        return this.ready
    }

    /**
     * Resuelve un código de transacción a su ruta de ejecución (BO y método).
     *
     * @param tx - Código de transacción (e.g., "AUTH_LOGIN")
     * @returns {{ objectName: string; methodName: string } | false} Objeto con ruta o false si no existe
     */
    getDataTx(tx: unknown): { objectName: string; methodName: string } | false {
        const route = this.mapper.resolve(tx)
        return route || false
    }

    /**
     * Verifica si un perfil tiene permisos para ejecutar un método.
     *
     * @param jsonData - Datos para verificación
     * @param jsonData.profileId - ID del perfil del usuario (was profile_id)
     * @param jsonData.methodName - Nombre del método (was method_na)
     * @param jsonData.objectName - Nombre del Business Object (was object_na)
     * @returns {boolean} True si tiene permiso, False en caso contrario
     */
    getPermissions(jsonData: {
        profileId: number
        methodName: string
        objectName: string
    }): boolean {
        return this.guard.check(jsonData.profileId, jsonData.objectName, jsonData.methodName)
    }

    /**
     * Ejecuta un método de negocio a través del Executor.
     *
     * @param jsonData - Datos de ejecución
     * @param jsonData.objectName - Nombre del Business Object
     * @param jsonData.methodName - Nombre del método
     * @param jsonData.params - Parámetros para la función
     * @returns Resultado de la ejecución
     */
    async executeMethod(jsonData: {
        objectName: string
        methodName: string
        params: Record<string, unknown> | null | undefined
    }): Promise<{ code: number; msg: string; [key: string]: unknown }> {
        try {
            return (await this.executor.execute(
                jsonData.objectName,
                jsonData.methodName,
                jsonData.params
            )) as { code: number; msg: string; [key: string]: unknown }
        } catch (err: unknown) {
            this.log.error(
                `${this.i18n.messages.errors.server.serverError.msg}, SecurityService.executeMethod: ${err instanceof Error ? err.message : String(err)}`,
                {
                    objectName: jsonData.objectName,
                    methodName: jsonData.methodName,
                }
            )
            return this.i18n.messages.errors.server.serverError
        }
    }
}
