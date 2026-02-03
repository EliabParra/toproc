import { Pool } from 'pg'
import type { AppMessages } from '../locales/es.js'
import type { AppRequest, AppResponse } from './http.js'

export type { AppMessages }

/**
 * Interfaz para servicios de logging.
 * Estandariza la salida de logs en toda la aplicación.
 */
/**
 * Niveles de Log estándar (RFC 5424 simplificado).
 */
export enum LogLevel {
    TRACE = 10,
    DEBUG = 20,
    INFO = 30,
    WARN = 40,
    ERROR = 50,
    CRITICAL = 60,
}

/**
 * Interfaz para servicios de logging.
 * Estandariza la salida de logs en toda la aplicación.
 */
export interface ILogger {
    // Niveles estándar
    trace(msg: string, ctx?: object): void
    debug(msg: string, ctx?: object): void
    info(msg: string, ctx?: object): void
    warn(msg: string, ctx?: object): void
    error(msg: string, ctx?: object | Error): void
    critical(msg: string, ctx?: object | Error): void

    // Soporte para loggers hijos con contexto pinned
    child(ctx: object): ILogger
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
// Helper para obtener claves anidadas de AppMessages
type HelperKeys<T> = T extends object
    ? {
          [K in keyof T]: K extends string
              ? T[K] extends string
                  ? K
                  : `${K}.${HelperKeys<T[K]>}`
              : never
      }[keyof T]
    : never

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type TxKey = HelperKeys<AppMessages>

export interface II18nService {
    currentLocale: string
    messages: AppMessages

    /**
     * Traduce una clave a texto.
     * Soporta claves anidadas (e.g. 'auth.login.success') e interpolación.
     *
     * @param key Clave del mensaje.
     * @param params Variables para interpolar.
     * @param locale Idioma opcional.
     */
    translate(key: TxKey | (string & {}), params?: Record<string, unknown>, locale?: string): string

    /**
     * Formatea una fecha según el locale actual.
     * @param date Fecha a formatear
     * @param options Opciones de Intl.DateTimeFormat
     */
    formatDate(date: Date | number, options?: Intl.DateTimeFormatOptions): string

    /**
     * Formatea una moneda según el locale actual.
     * @param amount Cantidad monetaria
     * @param currency Código de moneda (e.g. 'USD', 'EUR')
     */
    formatCurrency(amount: number, currency: string): string

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
        selectorOrKey: string | ((msgs: AppMessages['errors']) => { msg: string; code: number }),
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

    /**
     * Cierra el pool de conexiones.
     */
    shutdown(): Promise<void>
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
 * Resultado de inicio de sesión.
 */
export type SessionResult =
    | {
          status: 'success'
          user: { id: number; username: string; email: string; profile_id: number }
          msg: { code: number; msg: string }
      }
    | { status: 'error'; error: { code: number; msg: string } }
    | {
          status: 'validation_error'
          error: { code: number; msg: string }
          errors: { path: string; message: string }[]
          alerts: unknown
      }

/**
 * Servicio de gestión de sesiones.
 */
export interface ISessionService {
    sessionExists(req: AppRequest): boolean
    createSession(req: AppRequest): Promise<SessionResult>
    destroySession(req: AppRequest): void
}

/**
 * Servicio de envío de correos electrónicos.
 */
export interface IEmailService {
    /**
     * Envía un correo electrónico simple (texto plano o HTML raw).
     */
    send(params: {
        to: string
        subject: string
        text?: string
        html?: string
    }): Promise<{ ok: boolean; mode: string }>

    /**
     * Envía un correo usando una plantilla HTML.
     */
    sendTemplate(params: {
        to: string
        subject: string
        templatePath: string
        data: Record<string, unknown>
    }): Promise<{ ok: boolean; mode: string }>

    /** Enmascara un email para logs */
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
    validator: IValidator
    i18n: II18nService
    email: IEmailService
}

/**
 * Proveedor de verificación de permisos.
 */
export interface IPermissionProvider {
    /**
     * Carga los permisos desde la fuente de datos.
     */
    load(): Promise<void>
    /**
     * Verifica si un perfil tiene acceso a un método de un objeto.
     * @param profileId - ID del perfil
     * @param objectName - Nombre del objeto
     * @param methodName - Nombre del método
     */
    check(profileId: number, objectName: string, methodName: string): boolean
}

/**
 * Ruta de ejecución de una transacción.
 */
export type TransactionRoute = {
    objectName: string
    methodName: string
}

/**
 * Mapeador de transacciones.
 * Traduce códigos de transacción a rutas de ejecución.
 */
export interface ITransactionMapper {
    load(): Promise<void>
    resolve(tx: unknown): TransactionRoute | null
}

/**
 * Ejecutor de transacciones.
 * Carga e invoca dinámicamente lógica de negocio.
 */
export interface ITransactionExecutor {
    execute(
        objectName: string,
        methodName: string,
        params: Record<string, unknown> | null | undefined
    ): Promise<unknown>
}

/**
 * Contexto de Seguridad Inmutable.
 * Transporta la identidad del usuario a través de la transacción.
 */
export interface ISecurityContext {
    readonly userId: number
    readonly profileId: number
    readonly username: string
}
