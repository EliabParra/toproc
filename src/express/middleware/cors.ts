import cors from 'cors'
import { IConfig } from '../../types/core.js'

/**
 * Aplica configuración de CORS si está habilitada en la configuración.
 *
 * Valida el origen contra una lista blanca (`config.cors.origins`) para seguridad estricta.
 * Configura métodos permitidos, credenciales y headers expuestos seguramenete.
 *
 */
export function applyCorsIfEnabled(app: any, deps: { config: IConfig }) {
    const { config } = deps
    if (!config.cors?.enabled) return

    const allowedOrigins = Array.isArray(config.cors.origins) ? config.cors.origins : []

    app.use(
        cors({
            origin: (origin: any, callback: any) => {
                if (!origin) return callback(null, true)
                if (allowedOrigins.includes(origin)) return callback(null, true)
                return callback(new Error(`CORS origin not allowed: ${origin}`))
            },
            credentials: Boolean(config.cors.credentials),
            methods: ['GET', 'POST', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'X-Request-Id', 'X-CSRF-Token'],
            exposedHeaders: ['X-Request-Id'],
            optionsSuccessStatus: 204,
        })
    )
}
