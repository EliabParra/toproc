import { ZodType } from 'zod'
import type {
    IDatabase,
    ILogger,
    IConfig,
    IValidator,
    II18nService,
    BODependencies,
    ApiResponse,
    TxKey,
    ValidationError,
    AppMessages,
} from '../../types/index.js'

export type { BODependencies }

/**
 * Clase base para todos los Business Objects (BOs) en el framework ToProccess.
 *
 * Los Business Objects encapsulan lógica de dominio y manejan solicitudes de transacciones.
 * Cada método de un BO típicamente corresponde a una transacción definida en el transactionMap.
 *
 * Provee métodos helpers para estandarizar respuestas (`success`, `error`, `created`)
 * y facilitar la validación de datos (`validate`).
 *
 * @abstract
 *
 * @example
 * ```typescript
 * import { BaseBO, BODependencies } from '../core/base/BaseBO.js'
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
    protected readonly validator: IValidator

    /** Servicio i18n */
    protected readonly i18n: II18nService

    /** Acceso tipado a mensajes de aplicación */
    protected get appMessages(): AppMessages {
        return this.i18n.messages
    }

    /**
     * Crea una nueva instancia de Business Object.
     *
     * @param deps - Dependencias requeridas inyectadas por el Dispatcher
     */
    constructor(deps: Partial<BODependencies> = {}) {
        if (!deps.db || !deps.log || !deps.config || !deps.validator || !deps.i18n) {
            throw new Error('Missing required dependencies')
        }

        this.db = deps.db
        this.log = deps.log
        this.config = deps.config
        this.validator = deps.validator
        this.i18n = deps.i18n
    }

    /**
     * Traduce una clave usando el servicio i18n inyectado.
     * Si no hay servicio i18n, retorna la clave.
     *
     * @param key - Clave de traducción
     * @param params - Parámetros de interpolación
     */
    protected translate(key: TxKey | (string & {}), params?: Record<string, any>): string {
        return this.i18n.translate(key, params)
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
    protected success<T>(data: T, msg: TxKey | (string & {}) = 'OK'): ApiResponse<T> {
        return { code: 200, msg: this.translate(msg), data }
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
    protected created<T>(data: T, msg: TxKey | (string & {}) = 'Created'): ApiResponse<T> {
        return { code: 201, msg: this.translate(msg), data }
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
    protected validationError(alerts: string[], errors: ValidationError[] = []): ApiResponse {
        return { code: 400, msg: 'Validation Error', alerts, errors }
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
        schema: unknown
    ): { ok: true; data: T } | { ok: false; alerts: string[]; errors: ValidationError[] } {
        const result = this.validator.validate<T>(data, schema)
        if (result.valid && result.data) {
            return { ok: true, data: result.data }
        }

        const errors = result.errors || []
        // ValidatorService already translates messages, no need to re-translate here
        const alerts = result.errors?.map((e: { message: string }) => e.message) || [
            'Error de validación desconocido',
        ]
        return { ok: false, alerts, errors }
    }
    /**
     * Ejecuta una operación de negocio con validación y manejo de errores estandarizado.
     *
     * 1. Valida los `params` contra el `schema` Zod.
     * 2. Si falla la validación, retorna un `validationError`.
     * 3. Si pasa, ejecuta la función `fn`.
     * 4. Captura cualquier error y lo formatea usando `safeCatch`.
     *
     * @template TIn - Tipo de los datos de entrada (inferido del schema)
     * @template TOut - Tipo de los datos de salida (inferido del retorno de fn)
     *
     * @param params - Datos de entrada crudos
     * @param schema - Esquema Zod para validación
     * @param fn - Función asíncrona que contiene la lógica de negocio
     */
    protected async exec<TIn, TOut>(
        params: TIn,
        schema: ZodType<TIn> | null,
        fn: (data: TIn) => Promise<ApiResponse<TOut>>
    ): Promise<ApiResponse<TOut>> {
        try {
            if (schema) {
                const vRes = this.validate<TIn>(params, schema)
                if (!vRes.ok) throw this.validationError(vRes.alerts, vRes.errors)
                return await fn(vRes.data)
            }

            return await fn(params)
        } catch (error) {
            return this.safeCatch(error) as any
        }
    }

    /**
     * Maneja errores de forma segura, detectando si son BOErrors conocidos.
     */
    protected safeCatch(error: unknown): ApiResponse {
        // Importación dinámica suave para evitar ciclos si BOError llega a depender de BaseBO (aunque no debería)
        // Pero para simplificar, asumimos que el usuario comprobará 'code' y 'tag' si existen
        const anyErr = error as any

        // Si ya tiene estructura de respuesta (e.g. lanzado como objeto), úsalo
        if (anyErr.code && anyErr.msg && !anyErr.tag) return anyErr

        // Si es un BOError (tiene tag y code)
        if (anyErr.tag && anyErr.code) {
            return this.error(this.translate(anyErr.message), anyErr.code)
        }

        this.log.error('BaseBO Exception', error as Error)
        return this.error('Error interno del servidor', 500)
    }
}
