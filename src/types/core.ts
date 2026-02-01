import { Pool } from 'pg'
import type { AppRequest, AppResponse } from './http.js'

/**
 * Interfaz para servicios de logging.
 * Estandariza la salida de logs en toda la aplicación.
 */
export interface ILogger {
    TYPE_ERROR: number
    TYPE_INFO: number
    TYPE_DEBUG: number
    TYPE_WARNING: number
    /**
     * Escribe una entrada en el log.
     * @param params - Objeto con detalles o mensaje simple
     */
    show(params: { type: number; msg?: unknown; ctx?: unknown } | string): void
}

/**
 * Interfaz para el validador de la aplicación.
 */
export interface IValidator {
    /**
     * Valida datos contra un esquema.
     * @template T Tipo de datos esperado
     * @param data Datos a validar
     * @param schema Esquema de validación
     */
    validate<T>(
        data: unknown,
        schema: unknown
    ):
        | { valid: true; data: T; errors?: never }
        | { valid: false; data?: never; errors: { path: string; message: string; code?: string }[] }
}

/**
 * Servicio de internacionalización.
 */
export interface II18nService {
    currentLocale: string
    messages: Record<string, unknown>

    /**
     * Obtiene una traducción por su clave (Legacy).
     * @param key Clave del mensaje (e.g. 'auth.login.success')
     * @param params Variables para interpolar
     * @param locale Idioma opcional
     */
    t(key: string, params?: Record<string, unknown>, locale?: string): string

    /**
     * Interpola parámetros en un template string.
     */
    format(template: string, params?: Record<string, unknown>): string

    /**
     * Selecciona el objeto de mensajes para el idioma actual.
     */
    use<T>(messageSet: Record<string, T>): NonNullable<T>

    /**
     * Obtiene un objeto de error HTTP con código y mensaje.
     * Soporta selector function (Typed) o key string (Legacy).
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    error(
        selectorOrKey: string | ((msgs: any) => { msg: string; code: number }),
        params?: Record<string, unknown>
    ): { msg: string; code: number }

    /**
     * Obtiene el valor raw de una clave (para estructuras anidadas).
     * @param key Clave de acceso
     * @param locale Idioma opcional
     */
    get(key: string, locale?: string): unknown
}

/**
 * Interfaz para acceso a base de datos.
 * Abstrae la ejecución de queries SQL.
 */
export interface IDatabase {
    pool: Pool
    /**
     * Ejecuta una query predefinida.
     * @param schema Esquema/Namespace de la query
     * @param query Nombre de la query
     * @param params Parámetros (array u objeto)
     */
    /**
     * Executes a raw query or query definition.
     */
    exeRaw(
        sql: string,
        params?: unknown
    ): Promise<{ rows: Record<string, unknown>[]; rowCount: number | null }>

    /**
     * Executes a raw query or query definition.
     */
    query<T extends Record<string, unknown> = Record<string, unknown>>(
        queryDef: string | { sql: string },
        params?: unknown[]
    ): Promise<{ rows: T[]; rowCount: number | null }>
}

/**
 * Configuración global de la aplicación.
 * Re-exportado desde config.ts para compatibilidad.
 */
export type { IAppConfig as IConfig } from './config.js'

// Import para uso en interfaces locales
import type { IAppConfig } from './config.js'

/**
 * Servicio de seguridad y orquestación de transacciones.
 */
export interface ISecurityService {
    isReady: boolean
    ready: Promise<boolean>
    /** Resuelve una transacción a BO/Método */
    getDataTx(tx: unknown): { objectName: string; methodName: string } | false
    /** Verifica permisos de acceso */
    getPermissions(data: { profileId: number; methodName: string; objectName: string }): boolean
    /** Ejecuta un método de negocio */
    executeMethod(data: {
        objectName: string
        methodName: string
        params: Record<string, unknown>
    }): Promise<{ code: number; msg: string; [key: string]: unknown }>
}

/**
 * Servicio de gestión de sesiones.
 */
export interface ISessionService {
    sessionExists(req: AppRequest): boolean
    createSession(req: AppRequest, res: AppResponse): Promise<AppResponse>
    destroySession(req: AppRequest): void
}

/**
 * Servicio de envío de correos electrónicos.
 */
export interface IEmailService {
    sendLoginChallenge(params: {
        to: string
        token: string
        code: string
        appName?: unknown
    }): Promise<{ ok: boolean; mode: string }>
    sendPasswordReset(params: {
        to: string
        token: string
        code: string
        appName?: unknown
    }): Promise<{ ok: boolean; mode: string }>
    sendEmailVerification(params: {
        to: string
        token: string
        code: string
        appName?: unknown
    }): Promise<{ ok: boolean; mode: string }>
    maskEmail(email: string): string
}

/**
 * Contenedor de inyección de dependencias.
 */
export interface IContainer {
    resolve<T>(key: string): T
}

/**
 * Servicio de auditoría.
 */
export interface IAuditService {
    log(
        req: AppRequest,
        args: {
            action: string
            objectName?: string | null
            methodName?: string | null
            tx?: unknown
            user_id?: number | null
            profile_id?: number | null
            details?: Record<string, unknown>
        }
    ): Promise<void>
}
/**
 * Dependencias inyectables para Business Objects (BO).
 * Este objeto agrupa todos los servicios necesarios para la lógica de negocio.
 */
export interface BODependencies {
    db: IDatabase
    log: ILogger
    config: IAppConfig
    audit: IAuditService
    security: ISecurityService
    session: ISessionService
    v: IValidator
    i18n: II18nService
}
