import session, { SessionOptions, Store } from 'express-session'
import connectPgSimple from 'connect-pg-simple'
import { IConfig, ILogger, IDatabase } from '../../../types/core.js'
import { Express } from 'express'
import { Pool } from 'pg'

// Definición de tipos para la configuración de sesión
interface SessionCookieConfig {
    httpOnly?: boolean
    secure?: boolean
    maxAge?: number
    sameSite?: boolean | 'lax' | 'strict' | 'none'
}

interface SessionStoreConfig {
    type?: string
    tableName?: string
    schemaName?: string
    ttlSeconds?: number
    pruneIntervalSeconds?: number
}

interface SessionConfig {
    resave?: boolean
    saveUninitialized?: boolean
    secret: string
    name?: string
    cookie?: SessionCookieConfig
    store?: SessionStoreConfig
    duration?: number // Duración heredada para maxAge
    proxy?: boolean
}

type Dependencies = {
    config: IConfig
    log: ILogger
    db: IDatabase
}

/**
 * Configura el middleware de sesión (express-session) con almacenamiento persistente.
 *
 * Sigue principios de Clean Code:
 * - Tipado estricto para configuraciones.
 * - Separación de lógica de construcción del Store.
 * - Validación explicita de opciones de seguridad (Cookies).
 *
 * @param app - Instancia de Express
 * @param deps - Dependencias necesarias (config, log, db)
 *
 * @example
 * ```typescript
 * applySessionMiddleware(app, {
 *   config: appConfig,
 *   log: logger,
 *   db: database
 * })
 * ```
 */
export function applySessionMiddleware(app: Express, deps: Dependencies) {
    const { config, log, db } = deps

    // 1. Normalizar configuración
    const rawSessionConfig = config.session as SessionConfig | undefined
    if (!rawSessionConfig) {
        log.warn('Configuración de sesión no encontrada, se usarán valores por defecto inseguros.')
    }

    const sessionOptions = buildSessionOptions(
        rawSessionConfig ?? { secret: 'default-secret' },
        log
    )

    // 2. Configurar Store (PostgreSQL o Memoria)
    if (rawSessionConfig?.store?.type === 'pg') {
        sessionOptions.store = createPgStore(rawSessionConfig.store, rawSessionConfig.cookie, db)
    }

    // 3. Ajustes específicos de Proxy
    if (sessionOptions.cookie?.secure && app.get('trust proxy') == null) {
        app.set('trust proxy', 1)
    }

    app.use(session(sessionOptions))
}

/**
 * Construye las opciones de sesión aplicando valores por defecto y correcciones de seguridad.
 *
 * @param config - Configuración cruda
 * @param log - Logger para advertencias
 * @returns Opciones de sesión listas para express-session
 */
function buildSessionOptions(config: SessionConfig, log: ILogger): SessionOptions {
    const cookie: SessionCookieConfig = {
        httpOnly: true, // Por defecto true para evitar XSS
        ...config.cookie,
    }

    // Normalizar sameSite
    if (typeof cookie.sameSite === 'boolean') {
        cookie.sameSite = cookie.sameSite ? 'lax' : 'strict'
    }

    // Sincronizar duración si maxAge no está definido
    if (cookie.maxAge == null && config.duration != null) {
        cookie.maxAge = config.duration
    }

    // Validación de seguridad para cookies SameSite=None
    if (cookie.sameSite === 'none' && !cookie.secure) {
        log.warn(
            'Cookie de sesión tiene sameSite="none" sin secure=true. Los navegadores rechazarán esta cookie.'
        )
    }

    return {
        secret: config.secret,
        name: config.name,
        resave: config.resave ?? false,
        saveUninitialized: config.saveUninitialized ?? false,
        cookie: cookie as session.CookieOptions,
        proxy: config.cookie?.secure ? true : undefined,
    }
}

/**
 * Crea una instancia de PostgresStore para persistencia de sesiones.
 *
 * @param storeConfig - Configuración específica del almacenamiento
 * @param cookieConfig - Configuración de cookies (para inferir TTL)
 * @param db - Adaptador de base de datos
 * @returns Instancia de Store compatible con express-session
 */
function createPgStore(
    storeConfig: SessionStoreConfig,
    cookieConfig: SessionCookieConfig | undefined,
    db: IDatabase
): Store {
    const PgSession = connectPgSimple(session)

    // Calcular Tiempo de Vida (TTL)
    const ttlSecondsFromCookie =
        typeof cookieConfig?.maxAge === 'number' ? Math.ceil(cookieConfig.maxAge / 1000) : undefined

    const ttl = storeConfig.ttlSeconds ?? ttlSecondsFromCookie

    // connect-pg-simple espera un pool de pg.
    const pool: Pool = db.pool

    return new PgSession({
        pool,
        tableName: storeConfig.tableName ?? 'session',
        schemaName: storeConfig.schemaName,
        ttl,
        pruneSessionInterval: storeConfig.pruneIntervalSeconds ?? 300,
    })
}
