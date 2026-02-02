import { ILogger, AppRequest, AppResponse } from '../../../types/index.js'
import { Express, NextFunction } from 'express'
import { redactSecrets } from '../../../utils/sanitize.js'

/**
 * Middleware para logging de peticiones HTTP.
 *
 * Registra cada petición al finalizar (evento 'finish'), incluyendo:
 * - Método y URL
 * - Código de estado
 * - Duración en ms
 * - Request ID para trazabilidad
 * - Usuario y perfil (si hay sesión)
 * - **Body**: Sanitizado automáticamente (oculta passwords y tokens).
 *
 * Evita duplicar logs de errores si ya fueron registrados por otros capturadores
 * (usando `res.locals.__errorLogged`).
 *
 * @param app - Instancia de la aplicación Express.
 * @param log - Instancia del logger para registrar los eventos.
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
                    body: req.body ? redactSecrets(req.body) : undefined,
                }

                if (status >= 400) {
                    if (res.locals?.__errorLogged) return
                    log.warn(`${req.method} ${req.originalUrl} ${status}`, ctx)
                    return
                }

                log.info(`${req.method} ${req.originalUrl} ${status}`, ctx)
            } catch {}
        })
        next()
    })
}
