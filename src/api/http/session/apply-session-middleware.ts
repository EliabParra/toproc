import session from 'express-session'
import connectPgSimple from 'connect-pg-simple'
import { IConfig, ILogger, IDatabase } from '../../../types/core.js'

/**
 * Configura el middleware de sesión (express-session) con almacenamiento persistente.
 *
 * Soporta PostgreSQL (connect-pg-simple) o MemoryStore.
 * Configura seguridad de cookies (Secure, HttpOnly, SameSite) basada en configuración.
 *
 * @param app - Instancia de Express
 * @param deps - Dependencias (config, log, db)
 */
export function applySessionMiddleware(
    app: any,
    deps: { config: IConfig; log: ILogger; db: IDatabase }
) {
    const { config, log, db } = deps
    const PgSession = connectPgSimple(session)

    const sessionConfig: any = JSON.parse(JSON.stringify(config.session ?? {}))
    sessionConfig.cookie = sessionConfig.cookie ?? {}

    // Resolve deprecation warnings
    if (sessionConfig.resave === undefined) sessionConfig.resave = false
    if (sessionConfig.saveUninitialized === undefined) sessionConfig.saveUninitialized = false

    if (sessionConfig.cookie.httpOnly == null) sessionConfig.cookie.httpOnly = true

    if (typeof sessionConfig.cookie.sameSite === 'boolean') {
        sessionConfig.cookie.sameSite = sessionConfig.cookie.sameSite ? 'lax' : 'strict'
    }

    if (sessionConfig.cookie.maxAge == null && sessionConfig.duration != null) {
        sessionConfig.cookie.maxAge = sessionConfig.duration
    }

    if (sessionConfig.cookie.sameSite === 'none' && sessionConfig.cookie.secure !== true) {
        log.show({
            type: log.TYPE_WARNING,
            msg: 'Session cookie sameSite="none" without secure=true. Browsers will reject this cookie in most cases.',
        })
    }

    if (sessionConfig.cookie.secure === true) {
        // When running behind a proxy/LB that terminates TLS, secure cookies require trust proxy.
        // Don't override an explicit app-level trust proxy setting.
        if (app.get('trust proxy') == null) {
            app.set('trust proxy', 1)
        }
        sessionConfig.proxy = true
    }

    if (sessionConfig.store?.type === 'pg') {
        const tableName = sessionConfig.store?.tableName || 'session'
        const schemaName = sessionConfig.store?.schemaName
        const ttlSecondsFromCookie =
            typeof sessionConfig.cookie?.maxAge === 'number'
                ? Math.ceil(sessionConfig.cookie.maxAge / 1000)
                : undefined
        const ttlSeconds = sessionConfig.store?.ttlSeconds ?? ttlSecondsFromCookie
        const pruneIntervalSeconds = sessionConfig.store?.pruneIntervalSeconds ?? 300

        sessionConfig.store = new PgSession({
            // @ts-ignore - IDatabase abstraction vs generic Pool expectation
            pool: (db as any).pool, // Assuming IDatabase implementation exposes pool or we pass raw pool?
            // DBComponent has 'pool' (pg.Pool).
            tableName,
            ...(schemaName ? { schemaName } : {}),
            ...(ttlSeconds != null ? { ttl: ttlSeconds } : {}),
            ...(pruneIntervalSeconds != null ? { pruneSessionInterval: pruneIntervalSeconds } : {}),
        })
    } else {
        delete sessionConfig.store
    }

    app.use(session(sessionConfig))
}
