import { randomBytes } from 'node:crypto'
import { IConfig } from '../../../types/core.js'

/**
 * Genera o recupera el token CSRF de la sesión actual.
 * Si no existe token en la sesión, genera uno nuevo criptográficamente seguro.
 *
 * @param req - Request Express con soporte de sesión
 * @returns {string|null} Token CSRF o null si no hay sesión disponible
 */
export function ensureCsrfToken(req: any) {
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
 * @param deps - Dependencias (configuración, mensajes)
 * @returns {Function} Handler de Express
 */
export function createCsrfTokenHandler(deps: { config: IConfig; msgs: any }) {
    const { config, msgs } = deps
    return function csrfTokenHandler(req: any, res: any) {
        const token = ensureCsrfToken(req)
        if (!token) {
            return res
                .status((msgs as any)[(config as any).app.lang].errors.client.unknown.code)
                .send((msgs as any)[(config as any).app.lang].errors.client.unknown)
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
 * @param deps - Dependencias (configuración, mensajes)
 * @returns {Function} Middleware de Express
 */
export function createCsrfProtection(deps: { config: IConfig; msgs: any }) {
    const { config, msgs } = deps
    return function csrfProtection(req: any, res: any, next: any) {
        // Preserve previous semantics: if there's no authenticated session yet,
        // keep returning the existing 401 behavior for endpoints that already check auth.
        if (
            ((req as any).path === '/toProccess' || (req as any).path === '/logout') &&
            !req.session?.user_id
        ) {
            return next()
        }

        const expected = req.session?.csrfToken
        const provided = req.get?.('X-CSRF-Token')
        if (typeof expected !== 'string' || expected.length === 0) {
            return res
                .status((msgs as any)[(config as any).app.lang].errors.client.csrfInvalid.code)
                .send((msgs as any)[(config as any).app.lang].errors.client.csrfInvalid)
        }
        if (typeof provided !== 'string' || provided !== expected) {
            return res
                .status((msgs as any)[(config as any).app.lang].errors.client.csrfInvalid.code)
                .send((msgs as any)[(config as any).app.lang].errors.client.csrfInvalid)
        }
        return next()
    }
}
