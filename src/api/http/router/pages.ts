import express from 'express'
import path from 'path'
import { routes, pagesPath } from './routes.js'
import { IConfig, ILogger } from '../../../types/core.js'

type PagesRouterArgs = {
    session?: { sessionExists?: (req: any) => boolean }
    config: IConfig
    msgs: any
    log: ILogger
    routes?: any[]
}

/**
 * Construye el router de páginas (SSR/Static).
 * Mapea definiciones de rutas a archivos HTML y aplica protección de sesión si es necesario.
 *
 * @param args - Configuración ({ session, config, msgs, log, routes })
 * @returns Express Router
 */
export function buildPagesRouter({
    session,
    config,
    msgs,
    log,
    routes: providedRoutes,
}: PagesRouterArgs) {
    const activeRoutes = providedRoutes || routes
    const clientErrors = msgs[config.app.lang].errors.client
    const router = express.Router()

    const requireAuth = (req: any, res: any, next: any) => {
        if (!session?.sessionExists?.(req)) {
            const returnTo = encodeURIComponent(req.originalUrl || '/')
            return res.redirect(302, `/?returnTo=${returnTo}`)
        }
        next()
    }

    activeRoutes.forEach((r: any) => {
        const handler = (req: any, res: any) => {
            try {
                const viewPath = path.join(pagesPath, 'pages', `${r.view}.html`)
                res.status(200).sendFile(viewPath)
            } catch (err: any) {
                log.show({
                    type: (log as any).TYPE_ERROR,
                    msg: `Exception in ${r.path}: ${err.message}`,
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
