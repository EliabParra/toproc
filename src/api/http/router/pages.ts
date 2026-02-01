import express, { NextFunction } from 'express'
import path from 'path'
import { routes, pagesPath } from './routes.js'
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
    const clientErrors = i18n.get('errors.client') as Record<string, { msg: string; code: number }>
    const router = express.Router()

    const requireAuth = (req: AppRequest, res: AppResponse, next: NextFunction) => {
        if (!session?.sessionExists?.(req)) {
            const returnTo = encodeURIComponent(req.originalUrl || '/')
            return res.redirect(302, `/?returnTo=${returnTo}`)
        }
        next()
    }

    activeRoutes.forEach((r: PageRoute) => {
        const handler = (req: AppRequest, res: AppResponse) => {
            try {
                const viewPath = path.join(pagesPath, 'pages', `${r.view}.html`)
                res.status(200).sendFile(viewPath)
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : String(err)
                log.show({
                    type: log.TYPE_ERROR,
                    msg: `Exception in ${r.path}: ${message}`,
                })
                res.status(clientErrors.unknown.code).send(clientErrors.unknown)
            }
        }
        if (r.validateIsAuth) router.get(r.path, requireAuth, handler)
        else router.get(r.path, handler)
    })

    return router
}

export { pagesPath }
