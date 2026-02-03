import { ZodType } from 'zod'
import { BOError, isBOError } from './BOError.js'
import type {
    IDatabase,
    ILogger,
    IConfig,
    IValidator,
    II18nService,
    ISessionService,
    ISecurityService,
    IAuditService,
    BODependencies,
    ApiResponse,
    TxKey,
    ValidationError,
    AppMessages,
    AppRequest,
    IEmailService
} from '../../types/index.js'

export type { BODependencies, ApiResponse, TxKey, IDatabase, IConfig, II18nService, IEmailService }

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

    /** Servicio de seguridad (opcional) */
    protected readonly security?: ISecurityService

    /** Servicio de sesiones (opcional) */
    protected readonly session?: ISessionService

    /** Servicio de auditoría (opcional) */
    protected readonly audit?: IAuditService

    /** Servicio de correo electrónico (opcional) */
    protected readonly email?: IEmailService

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
        this.security = deps.security
        this.session = deps.session
        this.audit = deps.audit
        this.email = deps.email
    }

    /**
     * Traduce una clave usando el servicio i18n inyectado.
     * Si no hay servicio i18n, retorna la clave.
     *
     * @param key - Clave de traducción
     * @param params - Parámetros de interpolación
     */
    protected translate(key: TxKey | (string & {}), params?: Record<string, unknown>): string {
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
    protected error(msg: TxKey | (string & {}), code = 500, alerts: string[] = []): ApiResponse {
        return { code, msg: this.translate(msg), alerts }
    }

    /**
     * Alias explícito para respuestas exitosas (HTTP 200).
     */
    protected ok<T>(data: T, msg: TxKey | (string & {}) = 'OK'): ApiResponse<T> {
        return this.success(data, msg)
    }

    /**
     * Respuesta sin contenido (HTTP 204).
     */
    protected noContent(msg: TxKey | (string & {}) = 'OK'): ApiResponse<null> {
        return { code: 204, msg: this.translate(msg), data: null }
    }

    /**
     * Respuestas de error estándar.
     */
    protected badRequest(
        msg: TxKey | (string & {}) = 'errors.server.badRequest',
        alerts: string[] = []
    ): ApiResponse {
        return this.error(msg, 400, alerts)
    }

    protected unauthorized(msg: TxKey | (string & {}) = 'errors.server.unauthorized'): ApiResponse {
        return this.error(msg, 401)
    }

    protected forbidden(msg: TxKey | (string & {}) = 'errors.server.forbidden'): ApiResponse {
        return this.error(msg, 403)
    }

    protected notFound(msg: TxKey | (string & {}) = 'errors.server.notFound'): ApiResponse {
        return this.error(msg, 404)
    }

    protected conflict(
        msg: TxKey | (string & {}) = 'errors.client.invalidParameters'
    ): ApiResponse {
        return this.error(msg, 409)
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
        schema: ZodType<T>
    ): { ok: true; data: T } | { ok: false; alerts: string[]; errors: ValidationError[] } {
        const result = this.validator.validate<T>(data, schema)
        if (result.valid && result.data) {
            return { ok: true, data: result.data }
        }

        const errors = result.errors || []
        // ValidatorService already translates messages, no need to re-translate here
        const alerts = result.errors?.map((e) => e.message) || ['Error de validación desconocido']
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
            return this.safeCatch(error) as ApiResponse<TOut>
        }
    }

    /**
     * Ejecuta una operación de negocio sin esquema de validación.
     */
    protected async execRaw<TIn, TOut>(
        params: TIn,
        fn: (data: TIn) => Promise<ApiResponse<TOut>>
    ): Promise<ApiResponse<TOut>> {
        return this.exec(params, null, fn)
    }

    /**
     * Maneja errores de forma segura, detectando si son BOErrors conocidos.
     */
    protected safeCatch(error: unknown): ApiResponse {
        const anyErr = error as { code?: number; msg?: string; tag?: string; message?: string }

        // Si ya tiene estructura de respuesta (e.g. lanzado como objeto), úsalo
        if (typeof anyErr?.code === 'number' && typeof anyErr?.msg === 'string' && !anyErr.tag) {
            return anyErr as ApiResponse
        }

        if (isBOError(error)) {
            return this.error(error.key, error.code)
        }

        this.log.error('BaseBO Exception', error as Error)
        return this.error('errors.server.serverError', 500)
    }

    /**
     * Sanitiza identificadores SQL básicos (tabla/columna).
     */
    protected safeIdentifier(name: string, kind: 'table' | 'column'): string {
        if (!/^[a-zA-Z_][a-zA-Z0-9_.]*$/.test(name)) {
            throw new BOError('errors.client.invalidParameters', `db.invalid.${kind}`, 400, {
                name,
            })
        }

        return name
    }

    /**
     * Valida sesión activa usando SessionService si está disponible.
     */
    protected requireSession(
        req: AppRequest,
        msg: TxKey | (string & {}) = 'errors.client.login'
    ): void {
        if (!this.session) {
            throw new BOError('errors.server.serverError', 'auth.session.missing', 500)
        }

        if (!this.session.sessionExists(req)) {
            throw new BOError(msg, 'auth.session.required', 401)
        }
    }

    /**
     * Valida permisos de acceso usando SecurityService si está disponible.
     */
    protected requirePermission(data: {
        profileId: number
        objectName: string
        methodName: string
    }): void {
        if (!this.security) {
            throw new BOError('errors.server.serverError', 'security.missing', 500)
        }

        const allowed = this.security.getPermissions(data)
        if (!allowed) {
            throw new BOError('errors.client.permissionDenied', 'security.permission.denied', 403)
        }
    }

    /**
     * Valida roles básicos con una lista blanca de perfiles.
     */
    protected requireRole(profileId: number, allowed: number[]): void {
        if (!allowed.includes(profileId)) {
            throw new BOError('errors.client.permissionDenied', 'security.role.denied', 403)
        }
    }

    /**
     * Normaliza parámetros de paginación.
     */
    protected parsePagination(
        params: {
            limit?: number
            offset?: number
            maxLimit?: number
            defaultLimit?: number
        } = {}
    ): { limit: number; offset: number } {
        const defaultLimit = params.defaultLimit ?? 20
        const maxLimit = params.maxLimit ?? 100
        const rawLimit = Number(params.limit ?? defaultLimit)
        const rawOffset = Number(params.offset ?? 0)
        const limit = Math.min(Math.max(rawLimit, 1), maxLimit)
        const offset = Math.max(rawOffset, 0)
        return { limit, offset }
    }

    /**
     * Estructura estándar de paginación.
     */
    protected paginate<T>(
        items: T[],
        total: number,
        limit: number,
        offset: number
    ): {
        items: T[]
        meta: {
            total: number
            limit: number
            offset: number
            page: number
            pageCount: number
            hasNext: boolean
            hasPrev: boolean
        }
    } {
        const page = Math.floor(offset / limit) + 1
        const pageCount = Math.max(1, Math.ceil(total / limit))
        return {
            items,
            meta: {
                total,
                limit,
                offset,
                page,
                pageCount,
                hasNext: offset + items.length < total,
                hasPrev: offset > 0,
            },
        }
    }
}
