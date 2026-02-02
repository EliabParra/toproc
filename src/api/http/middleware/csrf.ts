import { randomBytes } from 'node:crypto'
import { IConfig, II18nService, AppRequest, AppResponse } from '../../../types/index.js'
import { NextFunction } from 'express'

/**
 * Genera o recupera el token CSRF de la sesión actual.
 * Si no existe token en la sesión, genera uno nuevo criptográficamente seguro.
 *
 * @param req - Request Express con soporte de sesión
 * @returns {string|null} Token CSRF o null si no hay sesión disponible
 */
export function ensureCsrfToken(req: AppRequest) {
    if (req.session == null) return null
    if (typeof req.session.csrfToken === 'string' && req.session.csrfToken.length > 0) {
        return req.session.csrfToken
    }
    const token = randomBytes(32).toString('hex')
    req.session.csrfToken = token
    return token
}

/**
 * Crea el handler para el endpoint GET /csrf.
 * Devuelve el token CSRF actual para que el frontend lo use en requests subsecuentes.
 *
 * @param i18n - Servicio de internacionalización
 * @returns {Function} Handler de Express
 */
export function createCsrfTokenHandler(i18n: II18nService) {
    return function csrfTokenHandler(req: AppRequest, res: AppResponse) {
        const token = ensureCsrfToken(req)
        if (!token) {
            const errDef = i18n.messages.errors.client.unknown
            return res.status(errDef.code).send(errDef)
        }
        return res.status(200).send({ csrfToken: token })
    }
}

/**
 * Middleware para protección CSRF (Cross-Site Request Forgery).
 * Verifica que el header `X-CSRF-Token` coincida con el token almacenado en la sesión.
 *
 * Comportamiento:
 * - Si no hay sesión de usuario, permite paso (para login)
 * - Si hay sesión, exige token válido
 *
 * @param i18n - Servicio de internacionalización
 * @returns {Function} Middleware de Express
 */
export function createCsrfProtection(i18n: II18nService) {
    return function csrfProtection(req: AppRequest, res: AppResponse, next: NextFunction) {
        // Preserve previous semantics: if there's no authenticated session yet,
        // keep returning the existing 401 behavior for endpoints that already check auth.
        if ((req.path === '/toProccess' || req.path === '/logout') && !req.session?.userId) {
            return next()
        }

        const expected = req.session?.csrfToken
        const provided = req.get('X-CSRF-Token')
        if (typeof expected !== 'string' || expected.length === 0) {
            const errDef = i18n.messages.errors.client.csrfInvalid
            return res.status(errDef.code).send(errDef)
        }
        if (typeof provided !== 'string' || provided !== expected) {
            const errDef = i18n.messages.errors.client.csrfInvalid
            return res.status(errDef.code).send(errDef)
        }
        return next()
    }
}
