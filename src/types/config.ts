/**
 * Tipos de Configuración
 *
 * Interfaces tipadas para todas las secciones de configuración.
 *
 * @module types/config
 */

/**
 * Configuración de la aplicación.
 */
export interface AppConfig {
    /** Puerto del servidor HTTP */
    port: number
    /** Host del servidor */
    host: string
    /** Nombre de la aplicación */
    name: string
    /** Idioma por defecto (es, en) */
    lang: string
    /** Modo de frontend: 'spa', 'pages', 'none' */
    frontendMode: 'spa' | 'pages' | 'none'
    /** Límite de tamaño para body de requests (e.g. '100kb') */
    bodyLimit?: string
    /** Configuración de trust proxy para Express */
    trustProxy?: number | boolean | string
}

/**
 * Configuración de base de datos PostgreSQL.
 */
export interface DbConfig {
    /** Cadena de conexión completa */
    connectionString?: string
    /** Host del servidor PostgreSQL */
    host?: string
    /** Puerto del servidor */
    port?: number
    /** Nombre de la base de datos */
    database?: string
    /** Usuario de la base de datos */
    user?: string
    /** Contraseña */
    password?: string
    /** Usar SSL */
    ssl?: boolean | { rejectUnauthorized: boolean }
}

/**
 * Configuración de sesiones.
 */
export interface SessionConfig {
    /** Secreto(s) para firmar cookies (string o array para rotación) */
    secret: string | string[]
    /** Nombre de la cookie de sesión */
    cookieName?: string
    /** Tiempo máximo de vida de la cookie en ms */
    maxAge?: number
    /** Cookie solo accesible via HTTP (no JS) */
    httpOnly?: boolean
    /** Cookie solo en HTTPS */
    secure?: boolean
    /** Política SameSite de la cookie */
    sameSite?: 'strict' | 'lax' | 'none'
    /** Nombre de la tabla de sesiones en PostgreSQL */
    tableName?: string
}

/**
 * Configuración de CORS.
 */
export interface CorsConfig {
    /** Habilitar CORS */
    enabled?: boolean
    /** Orígenes permitidos (alias: origins) */
    origin?: string | string[] | boolean
    /** Orígenes permitidos (array) */
    origins?: string[]
    /** Métodos HTTP permitidos */
    methods?: string[]
    /** Headers permitidos */
    allowedHeaders?: string[]
    /** Permitir credenciales */
    credentials?: boolean
}

/**
 * Configuración del logger.
 */
export interface LogConfig {
    /** Nivel de log: 'debug', 'info', 'warn', 'error' */
    minLevel?: 'debug' | 'info' | 'warn' | 'error'
    /** Formato de salida */
    format?: 'json' | 'text' | 'pretty'
    /** Incluir timestamp */
    timestamp?: boolean
    /** Niveles por categoría/módulo */
    categories?: Record<string, 'debug' | 'info' | 'warn' | 'error'>
}

/**
 * Configuración de autenticación.
 */
export interface AuthConfig {
    /** ID del perfil público (usuarios no autenticados) */
    publicProfileId?: number
    /** ID del perfil de sesión activa */
    sessionProfileId?: number
    /** Longitud del salt para bcrypt */
    saltRounds?: number
    /** Expiración de tokens de verificación (en minutos) */
    tokenExpiration?: number
    /** URL base para links de verificación */
    verificationBaseUrl?: string
    /** Requerir verificación de email para registro */
    requireEmailVerification?: boolean
    /** Propósito del token de verificación de email */
    emailVerificationPurpose?: string
    /** Propósito del token de reset de contraseña */
    passwordResetPurpose?: string
}

/**
 * Configuración del servicio de email.
 */
export interface EmailConfig {
    /** Proveedor de email */
    provider?: 'smtp' | 'sendgrid' | 'ses' | 'console'
    /** Configuración SMTP */
    smtp?: {
        host: string
        port: number
        secure?: boolean
        auth?: {
            user: string
            pass: string
        }
    }
    /** Email remitente */
    from?: string
    /** Nombre del remitente */
    fromName?: string
}

/**
 * Configuración de Business Objects.
 */
export interface BoConfig {
    /** Ruta al directorio de BOs */
    path: string
}

/**
 * Configuración global de la aplicación.
 */
export interface IAppConfig {
    app: AppConfig
    db: DbConfig
    session: SessionConfig
    cors: CorsConfig
    log: LogConfig
    auth: AuthConfig
    email: EmailConfig
    bo: BoConfig
}
