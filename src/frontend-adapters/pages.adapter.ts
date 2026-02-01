import express, { type Application } from 'express'
import { II18nService, IConfig, ILogger, ISessionService } from '../types/core.js'

/**
 * Configura el hosting de páginas estáticas o SSR.
 *
 * @param app - Instancia de Express
 * @param options - Dependencias ({ session, config, i18n, log })
 */
export async function registerPagesHosting(
    app: Application,
    {
        session,
        config,
        i18n,
        log,
    }: {
        session: Pick<ISessionService, 'sessionExists'>
        config: IConfig
        i18n: II18nService
        log: ILogger
    }
) {
    const { buildPagesRouter, pagesPath } = await import('../api/http/router/pages.js')
    app.use(express.static(pagesPath))
    app.use(buildPagesRouter({ session, config, i18n, log }))
}
