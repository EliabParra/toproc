import { IDatabase, ILogger, IConfig, IValidator, II18nService } from '../../types/core.js'
import { ApiResponse } from '../response/ApiResponse.js'

/**
 * Dependencias requeridas por todos los Business Objects.
 *
 * Se inyectan mediante el constructor para habilitar testabilidad y bajo acoplamiento.
 *
 * @example
 * ```typescript
 * const deps: BODependencies = {
 *     db: databaseInstance,
 *     log: loggerInstance,
 *     config: configInstance,
 *     v: validatorInstance
 * }
 * ```
 */
export type BODependencies = {
    /** Capa de acceso a base de datos */
    db: IDatabase
    /** Servicio de logging */
    log: ILogger
    /** Configuración de la aplicación */
    config: IConfig
    /** Instancia del validador (AppValidator o LegacyValidatorAdapter) */
    v: IValidator
    /** Servicio i18n opcional para localización de mensajes */
    i18n?: II18nService
    /** Objeto de mensajes legacy (deprecado, usar i18n) */
    msgs?: any
}

/**
 * Clase base para todos los Business Objects (BOs) en el framework ToProccess.
 *
 * Los Business Objects encapsulan lógica de dominio y manejan solicitudes de transacciones.
 * Cada método de un BO típicamente corresponde a una transacción definida en el transactionMap.
 *
 * @abstract
 * @example
 * ```typescript
 * import { BaseBO, BODependencies, ApiResponse } from '../core/base/BaseBO.js'
 * import { UserSchema } from './schemas.js'
 *
 * export default class UserBO extends BaseBO {
 *     constructor(deps: BODependencies) {
 *         super(deps)
 *     }
 *
 *     async getUser(params: unknown): Promise<ApiResponse> {
 *         const parsed = this.validate(params, UserSchema)
 *         if (!parsed.ok) return this.validationError(parsed.alerts)
 *
 *         const user = await this.db.exe('users', 'getById', [parsed.data.id])
 *         return this.success(user.rows[0])
 *     }
 * }
 * ```
 */
export abstract class BaseBO {
    /** Capa de acceso a base de datos para ejecutar consultas */
    protected readonly db: IDatabase

    /** Logger para salida de diagnóstico */
    protected readonly log: ILogger

    /** Configuración de la aplicación */
    protected readonly config: IConfig

    /** Validador para validación de entrada (soporta esquemas Zod) */
    protected readonly v: IValidator

    /** Servicio i18n opcional */
    protected readonly i18n?: II18nService

    /** Mensajes legacy (deprecado) */
    protected readonly msgs?: any

    /**
     * Crea una nueva instancia de Business Object.
     *
     * @param deps - Dependencias requeridas inyectadas por el Dispatcher
     */
    constructor(deps: BODependencies) {
        this.db = deps.db
        this.log = deps.log
        this.config = deps.config
        this.v = deps.v
        this.i18n = deps.i18n
        this.msgs = deps.msgs
    }

    /**
     * Crea una respuesta exitosa (HTTP 200).
     *
     * @template T - Tipo de los datos de respuesta
     * @param data - Los datos a incluir en la respuesta
     * @param msg - Mensaje opcional (por defecto: 'OK')
     * @returns ApiResponse con código 200
     *
     * @example
     * ```typescript
     * return this.success({ users: [...] })
     * return this.success({ id: 1 }, 'Usuario creado exitosamente')
     * ```
     */
    protected success<T>(data: T, msg = 'OK'): ApiResponse<T> {
        return { code: 200, msg, data }
    }

    /**
     * Crea una respuesta de recurso creado (HTTP 201).
     *
     * @template T - Tipo de los datos de respuesta
     * @param data - Los datos del recurso recién creado
     * @param msg - Mensaje opcional (por defecto: 'Created')
     * @returns ApiResponse con código 201
     *
     * @example
     * ```typescript
     * const newUser = await this.userService.create(data)
     * return this.created(newUser)
     * ```
     */
    protected created<T>(data: T, msg = 'Created'): ApiResponse<T> {
        return { code: 201, msg, data }
    }

    /**
     * Crea una respuesta de error.
     *
     * @param msg - Mensaje de error a mostrar
     * @param code - Código de estado HTTP (por defecto: 500)
     * @param alerts - Array opcional de mensajes de error detallados
     * @returns ApiResponse con el código de error especificado
     *
     * @example
     * ```typescript
     * return this.error('Usuario no encontrado', 404)
     * return this.error('Conexión a BD fallida', 503, ['Verificar estado de BD'])
     * ```
     */
    protected error(msg: string, code = 500, alerts: string[] = []): ApiResponse {
        return { code, msg, alerts }
    }

    /**
     * Crea una respuesta de error de validación (HTTP 400).
     *
     * @param alerts - Array opcional de mensajes de error de validación
     * @returns ApiResponse con código 400 y errores de validación
     *
     * @example
     * ```typescript
     * const parsed = this.validate(params, MySchema)
     * if (!parsed.ok) return this.validationError(parsed.alerts)
     * ```
     */
    protected validationError(alerts?: string[]): ApiResponse {
        const finalAlerts = alerts ?? (this.v.getAlerts ? this.v.getAlerts() : ['Validation Error'])
        return { code: 400, msg: 'Validation Error', alerts: finalAlerts }
    }

    /**
     * Valida datos de entrada contra un esquema Zod.
     *
     * Retorna una unión discriminada para fácil pattern matching:
     * - `{ ok: true, data: T }` - Validación exitosa, datos parseados disponibles
     * - `{ ok: false, alerts: string[] }` - Validación fallida, mensajes de error disponibles
     *
     * @template T - Tipo esperado de los datos validados
     * @param data - Datos de entrada crudos a validar
     * @param schema - Esquema Zod contra el cual validar
     * @returns Resultado de validación con datos parseados o mensajes de error
     *
     * @example
     * ```typescript
     * const parsed = this.validate<UserInput>(params, UserInputSchema)
     * if (!parsed.ok) {
     *     return this.validationError(parsed.alerts)
     * }
     * // TypeScript sabe que parsed.data es UserInput aquí
     * const user = await this.userService.create(parsed.data)
     * return this.success(user)
     * ```
     */
    protected validate<T>(
        data: unknown,
        schema: any
    ): { ok: true; data: T } | { ok: false; alerts: string[] } {
        const result = this.v.validate<T>(data, schema)
        if (result.valid && result.data) {
            return { ok: true, data: result.data }
        }

        const alerts = result.errors?.map((e: { message: string }) => e.message) || [
            'Error de validación desconocido',
        ]
        return { ok: false, alerts }
    }
}
