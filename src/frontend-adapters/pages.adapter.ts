import express from 'express'
import { II18nService } from '../types/core.js'

/**
 * Configura el hosting de páginas estáticas o SSR.
 *
 * @param app - Instancia de Express
 * @param options - Dependencias ({ session, config, i18n, log })
 */
export async function registerPagesHosting(
    app: any,
    { session, config, i18n, log }: { session: any; config: any; i18n: II18nService; log: any }
) {
    const { buildPagesRouter, pagesPath } = await import('../api/http/router/pages.js')
    app.use(express.static(pagesPath))
    app.use(buildPagesRouter({ session, config, i18n, log }))
}
