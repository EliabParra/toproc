import express, { NextFunction } from 'express'
import path from 'path'
import { routes, pagesPath } from './routes.js'
import { createAuthCheckMiddleware } from '../middleware/auth-check.js'
import { PageController } from '../controllers/PageController.js'
import type {
    IConfig,
    ILogger,
    II18nService,
    ISessionService,
    AppRequest,
    AppResponse,
} from '../../../types/index.js'

/** Route definition type */
interface PageRoute {
    path: string
    view: string
    validateIsAuth?: boolean
}

type PagesRouterArgs = {
    session?: Pick<ISessionService, 'sessionExists'>
    config: IConfig
    i18n: II18nService
    log: ILogger
    routes?: PageRoute[]
}

/**
 * Construye el router de páginas (SSR/Static).
 * Mapea definiciones de rutas a archivos HTML y aplica protección de sesión si es necesario.
 *
 * @param args - Configuración ({ session, config, i18n, log, routes })
 * @returns Express Router
 */
export function buildPagesRouter({
    session,
    config,
    i18n,
    log,
    routes: providedRoutes,
}: PagesRouterArgs) {
    const activeRoutes = providedRoutes || routes
    const router = express.Router()
    const pageController = new PageController(log, i18n)

    const requireAuth = session
        ? createAuthCheckMiddleware(session)
        : (_req: AppRequest, res: AppResponse, _next: NextFunction) => res.redirect('/')

    activeRoutes.forEach((r: PageRoute) => {
        const handler = pageController.serve(r.view)
        if (r.validateIsAuth) router.get(r.path, requireAuth, handler)
        else router.get(r.path, handler)
    })

    return router
}

export { pagesPath }
