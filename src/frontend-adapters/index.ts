import { II18nService } from '../types/core.js'

function getFrontendMode(config: any) {
    const raw = String((config as any)?.app?.frontendMode ?? 'pages')
        .trim()
        .toLowerCase()
    if (raw === 'pages' || raw === 'spa' || raw === 'none') return raw
    return 'pages'
}

type RegisterFrontendHostingArgs = {
    session: any
    stage: 'preApi' | 'postApi'
    config: any
    i18n: II18nService
    log: any
}

/**
 * Registra adaptadores de frontend opcionales.
 *
 * IMPORTANTE: el orden importa.
 * - pages mode debe ser registrado en el "preApi" stage (para que pueda tener sus propias rutas)
 * - spa mode debe ser registrado en el "postApi" stage (para que las rutas de API no sean sombreadas por el fallback SPA)
 */
export async function registerFrontendHosting(
    app: any,
    { session, stage, config, i18n, log }: RegisterFrontendHostingArgs
) {
    const mode = getFrontendMode(config)

    if (mode === 'none') return

    if (stage === 'preApi' && mode === 'pages') {
        const { registerPagesHosting } = await import('./pages.adapter.js')
        await registerPagesHosting(app, { session, config, i18n, log })
        return
    }

    if (stage === 'postApi' && mode === 'spa') {
        const { registerSpaHosting } = await import('./spa.adapter.js')
        await registerSpaHosting(app, { config })
    }
}
