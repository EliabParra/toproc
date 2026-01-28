import { redactSecretsInString } from '../../../utils/sanitize.js'
import { ILogger } from '../../../types/core.js'

export type FinalErrorHandlerArgs = {
    clientErrors: any
    serverErrors: any
    log: ILogger
}

/**
 * Middleware para manejo final de errores.
 *
 * Captura errores no controlados, los loguea de forma estructurada
 * y devuelve una respuesta estándar al cliente.
 *
 * Maneja:
 * - Sanitización de mensajes de error
 * - Traducción a códigos HTTP estándar
 * - Evita doble respuesta si headers ya fueron enviados
 *
 * @function createFinalErrorHandler
 * @param deps - Dependencias (errores configurados, logger)
 * @returns {Function} Middleware de error de Express
 */
export function createFinalErrorHandler({
    clientErrors,
    serverErrors,
    log,
}: FinalErrorHandlerArgs) {
    return function finalErrorHandler(err: any, req: any, res: any, next: any) {
        if ((res as any).headersSent) return next(err)

        let status = Number(err?.status ?? err?.statusCode)

        // Common infra errors we may emit
        if (
            typeof err?.message === 'string' &&
            err.message.startsWith('CORS origin not allowed:')
        ) {
            status = 403
        }

        if (err?.type === 'entity.too.large' || (err?.limit && err?.length)) {
            status = 413
        } else if (typeof err?.message === 'string' && /too large/i.test(err.message)) {
            status = 413
        }

        if (!Number.isInteger(status) || status < 400 || status > 599) status = 500

        let response = clientErrors.unknown
        if (status === 400) response = clientErrors.invalidParameters
        else if (status === 413) response = clientErrors.payloadTooLarge ?? clientErrors.unknown
        else if (status === 401) response = serverErrors.unauthorized
        else if (status === 403) response = serverErrors.forbidden
        else if (status === 404) response = serverErrors.notFound
        else if (status === 503) response = clientErrors.serviceUnavailable

        const rawMessage =
            typeof err?.message === 'string' ? redactSecretsInString(err.message.trim()) : ''
        const errorName =
            typeof err?.name === 'string' && err.name.trim() ? err.name.trim() : undefined
        const errorCode = err?.code != null ? String(err.code) : undefined
        const safeErrorMessage = rawMessage || errorName || errorCode || 'unknown'

        try {
            ;(res as any).locals.__errorLogged = true
        } catch {}
        log.show({
            type: log.TYPE_ERROR,
            msg: `${serverErrors.serverError.msg}, unhandled: ${safeErrorMessage}`,
            ctx: {
                requestId: req.requestId,
                method: req.method,
                path: req.originalUrl,
                status,
                user_id: req.session?.user_id,
                profile_id: req.session?.profile_id,
                durationMs:
                    typeof req.requestStartMs === 'number'
                        ? Date.now() - req.requestStartMs
                        : undefined,
                errorName,
                errorCode,
            },
        })

        return res.status(status).send({
            msg: response.msg,
            code: status,
            alerts: [],
        })
    }
}
