import { ILogger } from '../../types/core.js'

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
export function applyRequestLogger(app: any, deps: { log: ILogger }) {
    const { log } = deps
    // Log completed responses with duration and requestId.
    // For status >= 400 we log only if it wasn't already logged (to avoid duplication).
    app.use((req: any, res: any, next: any) => {
        const resAny = res as any
        resAny.once('finish', () => {
            try {
                const status = resAny.statusCode

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
                    user_id: req.session?.user_id,
                    profile_id: req.session?.profile_id,
                }

                if (status >= 400) {
                    if (resAny?.locals?.__errorLogged) return
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
