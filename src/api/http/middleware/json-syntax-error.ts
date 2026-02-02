import { II18nService, AppRequest, AppResponse } from '../../../types/index.js'
import { NextFunction } from 'express'

/**
 * Crea un middleware para capturar errores de sintaxis JSON en el body.
 *
 * Express/BodyParser lanza un error 400 si el JSON está mal formado (SyntaxError).
 * Este middleware intercepta ese error específico y devuelve nuestra respuesta estándar de "Parámetros inválidos".
 *
 * @function createJsonSyntaxErrorHandler
 * @param i18n - Servicio de internacionalización
 * @returns {Function} Middleware de manejo de errores Express
 */
export function createJsonSyntaxErrorHandler(i18n: II18nService) {
    return function jsonBodySyntaxErrorHandler(
        err: any,
        req: AppRequest,
        res: AppResponse,
        next: NextFunction
    ) {
        const errorObj = err as Record<string, unknown>
        const status = Number(errorObj?.status ?? errorObj?.statusCode)
        const isEntityParseFailed = errorObj?.type === 'entity.parse.failed'
        const isSyntaxError = err instanceof SyntaxError
        const looksLikeJsonParseError = status === 400 && (isEntityParseFailed || isSyntaxError)

        if (!looksLikeJsonParseError) return next(err)

        const alert = i18n.translate('alerts.invalidJson', { value: 'body' })
        const errorDef = i18n.messages.errors.client.invalidParameters

        return res.status(errorDef.code).send({
            msg: errorDef.msg,
            code: errorDef.code,
            alerts: [alert],
        })
    }
}
