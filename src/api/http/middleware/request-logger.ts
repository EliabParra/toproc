import { ILogger, AppRequest, AppResponse } from '../../../types/index.js'
import { Express, NextFunction } from 'express'

/**
 * Middleware para logging de peticiones HTTP.
 *
 * Registra cada petición al finalizar (evento 'finish'), incluyendo:
 * - Método y URL
 * - Código de estado
 * - Duración en ms
 * - Request ID para trazabilidad
 * - Usuario y perfil (si hay sesión)
 *
 * Evita duplicar logs de errores si ya fueron registrados por otros capturadores
 * (usando `res.locals.__errorLogged`).
 *
 */
export function applyRequestLogger(app: Express, log: ILogger) {
    // Log completed responses with duration and requestId.
    // For status >= 400 we log only if it wasn't already logged (to avoid duplication).
    app.use((req: AppRequest, res: AppResponse, next: NextFunction) => {
        res.once('finish', () => {
            try {
                const status = res.statusCode

                const durationMs =
                    typeof req.requestStartMs === 'number'
                        ? Date.now() - req.requestStartMs
                        : undefined

                const ctx = {
                    requestId: req.requestId,
                    method: req.method,
                    path: req.originalUrl,
                    status,
                    durationMs,
                    user_id: req.session?.userId,
                    profile_id: req.session?.profileId,
                }

                if (status >= 400) {
                    if (res.locals?.__errorLogged) return
                    log.show({
                        type: log.TYPE_WARNING,
                        msg: `${req.method} ${req.originalUrl} ${status}`,
                        ctx,
                    })
                    return
                }

                log.show({
                    type: log.TYPE_INFO,
                    msg: `${req.method} ${req.originalUrl} ${status}`,
                    ctx,
                })
            } catch {}
        })
        next()
    })
}
