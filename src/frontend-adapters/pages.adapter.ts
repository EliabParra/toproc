import express from 'express'

/**
 * Configura el hosting de páginas estáticas o SSR.
 *
 * @param app - Instancia de Express
 * @param options - Dependencias ({ session })
 */
export async function registerPagesHosting(app: any, { session }: { session: any }) {
    const { buildPagesRouter, pagesPath } = await import('../router/pages.js')
    app.use(express.static(pagesPath))
    app.use(buildPagesRouter({ session }))
}
