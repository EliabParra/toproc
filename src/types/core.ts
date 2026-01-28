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

    // Legacy support
    getAlerts?(): string[]
    // Legacy methods
    validateString?(opts: any): boolean
    validateLength?(opts: any, min: number, max: number): boolean
    validateEmail?(opts: any): boolean
}

/**
 * Servicio de internacionalización.
 */
export interface II18nService {
    /**
     * Obtiene una traducción por su clave.
     * @param key Clave del mensaje (e.g. 'auth.login.success')
     * @param props Variables para interpolar
     */
    t(key: string, props?: Record<string, unknown>): string
}

/**
 * Interfaz para acceso a base de datos.
 * Abstrae la ejecución de queries SQL.
 */
export interface IDatabase {
    /**
     * Ejecuta una query predefinida.
     * @param schema Esquema/Namespace de la query
     * @param query Nombre de la query
     * @param params Parámetros (array u objeto)
     */
    exe(
        schema: string,
        query: string,
        params?: unknown
    ): Promise<{ rows: any[]; rowCount: number | null }>

    /**
     * Ejecuta SQL crudo.
     * @param sql Sentencia SQL
     * @param params Parámetros posicionales
     */
    exeRaw(sql: string, params?: unknown): Promise<{ rows: any[]; rowCount: number | null }>

    /**
     * Ejecuta query con parámetros nombrados.
     * @param schema Esquema de la query
     * @param query Nombre de la query
     * @param paramsObj Objeto con valores
     * @param orderKeys Orden esperado de claves
     */
    exeNamed(
        schema: string,
        query: string,
        paramsObj: unknown,
        orderKeys: unknown[],
        opts?: { strict?: boolean; enforceSqlArity?: boolean }
    ): Promise<{ rows: any[]; rowCount: number | null }>
}

/**
 * Configuración global de la aplicación.
 */
export interface IConfig {
    app: {
        port: number
        host: string
        name: string
        lang: string
        frontendMode: string
        /** Límite de tamaño para body de requests (e.g. '100kb') */
        bodyLimit?: string
        trustProxy?: number | boolean | string
    }
    db: any
    session: any
    cors: any
    bo: {
        path: string
    }
    log: any
    auth: any
    email: any
}

/**
 * Servicio de seguridad y orquestación de transacciones.
 */
export interface ISecurityService {
    isReady: boolean
    ready: Promise<boolean>
    /** Resuelve una transacción a BO/Método */
    getDataTx(tx: unknown): { object_na: string; method_na: string } | false
    /** Verifica permisos de acceso */
    getPermissions(data: { profile_id: number; method_na: string; object_na: string }): boolean
    /** Ejecuta un método de negocio */
    executeMethod(data: {
        object_na: string
        method_na: string
        params: any
    }): Promise<{ code: number; msg: string; [key: string]: any }>
}

import { Request, Response } from 'express'

/**
 * Servicio de gestión de sesiones.
 */
export interface ISessionService {
    sessionExists(req: AppRequest): boolean
    createSession(req: AppRequest, res: AppResponse): Promise<any>
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
            object_na?: string | null
            method_na?: string | null
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
    config: IConfig
    msgs: any
    audit: IAuditService
    security: ISecurityService
    session: ISessionService
    validator: IValidator
}
