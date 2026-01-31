import { IConfig, II18nService } from '../../../types/core.js'

/**
 * Crea un middleware para capturar errores de sintaxis JSON en el body.
 *
 * Express/BodyParser lanza un error 400 si el JSON está mal formado (SyntaxError).
 * Este middleware intercepta ese error específico y devuelve nuestra respuesta estándar de "Parámetros inválidos".
 *
 * @function createJsonSyntaxErrorHandler
 * @param deps - Dependencias (config, i18n)
 * @returns {Function} Middleware de manejo de errores Express
 */
export function createJsonSyntaxErrorHandler(deps: { config: IConfig; i18n: II18nService }) {
    const { i18n } = deps
    return function jsonBodySyntaxErrorHandler(err: any, req: any, res: any, next: any) {
        const status = err?.status ?? err?.statusCode
        const isEntityParseFailed = err?.type === 'entity.parse.failed'
        const isSyntaxError = err instanceof SyntaxError
        const looksLikeJsonParseError = status === 400 && (isEntityParseFailed || isSyntaxError)

        if (!looksLikeJsonParseError) return next(err)

        const alert = i18n.t('alerts.invalidJson', { value: 'body' })
        const errorDef = i18n.error('errors.client.invalidParameters')

        return res.status(errorDef.code).send({
            msg: errorDef.msg,
            code: errorDef.code,
            alerts: [alert],
        })
    }
}
