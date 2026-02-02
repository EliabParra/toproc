import { redactSecretsInString } from '../../../utils/sanitize.js'
import {
    ILogger,
    LocalizedMessage,
    AppRequest,
    AppResponse,
    LocalizedMessages,
} from '../../../types/index.js'
import { NextFunction } from 'express'

export type FinalErrorHandlerArgs = {
    clientErrors: LocalizedMessages
    serverErrors: LocalizedMessages
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
 */
export function createFinalErrorHandler({
    clientErrors,
    serverErrors,
    log,
}: FinalErrorHandlerArgs) {
    return function finalErrorHandler(
        err: unknown,
        req: AppRequest,
        res: AppResponse,
        next: NextFunction
    ) {
        if (res.headersSent) return next(err)

        const errorObj = err as Record<string, unknown>
        let status = Number(errorObj?.status ?? errorObj?.statusCode)

        // Common infra errors we may emit
        if (
            typeof errorObj?.message === 'string' &&
            errorObj.message.startsWith('CORS origin not allowed:')
        ) {
            status = 403
        }

        if (errorObj?.type === 'entity.too.large' || (errorObj?.limit && errorObj?.length)) {
            status = 413
        } else if (typeof errorObj?.message === 'string' && /too large/i.test(errorObj.message)) {
            status = 413
        }

        if (!Number.isInteger(status) || status < 400 || status > 599) status = 500

        let response: LocalizedMessage = clientErrors.unknown
        if (status === 400) response = clientErrors.invalidParameters
        else if (status === 413) response = clientErrors.payloadTooLarge ?? clientErrors.unknown
        else if (status === 401) response = serverErrors.unauthorized
        else if (status === 403) response = serverErrors.forbidden
        else if (status === 404) response = serverErrors.notFound
        else if (status === 503) response = clientErrors.serviceUnavailable

        const rawMessage =
            typeof errorObj?.message === 'string'
                ? redactSecretsInString(errorObj.message.trim())
                : ''
        const errorName =
            typeof errorObj?.name === 'string' && errorObj.name.trim()
                ? errorObj.name.trim()
                : undefined
        const errorCode = errorObj?.code != null ? String(errorObj.code) : undefined
        const safeErrorMessage = rawMessage || errorName || errorCode || 'unknown'

        try {
            res.locals.__errorLogged = true
        } catch {}

        log.error(`${serverErrors.serverError.msg}, unhandled: ${safeErrorMessage}`, {
            requestId: req.requestId,
            method: req.method,
            path: req.originalUrl,
            status,
            user_id: req.session?.userId,
            profile_id: req.session?.profileId,
            durationMs:
                typeof req.requestStartMs === 'number'
                    ? Date.now() - req.requestStartMs
                    : undefined,
            errorName,
            errorCode,
        })

        return res.status(status).send({
            msg: response.msg,
            code: status,
            alerts: [],
        })
    }
}
