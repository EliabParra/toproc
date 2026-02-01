import { NextFunction } from 'express'
import { AppRequest, AppResponse, ISessionService } from '../../../types/index.js'

/**
 * Middleware para requerir autenticación en rutas de páginas.
 * Si no hay sesión activa, redirige al login.
 *
 * @param sessionService - Servicio de sesión para verificar estado
 */
export function createAuthCheckMiddleware(sessionService: Pick<ISessionService, 'sessionExists'>) {
    return function requireAuth(req: AppRequest, res: AppResponse, next: NextFunction) {
        if (!sessionService.sessionExists(req)) {
            const returnTo = encodeURIComponent(req.originalUrl || '/')
            return res.redirect(302, `/?returnTo=${returnTo}`)
        }
        next()
    }
}
