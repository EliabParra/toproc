import type { Application } from 'express'
import type { IConfig, ILogger, II18nService, ISessionService } from '../types/index.js'

function getFrontendMode(config: IConfig) {
    const raw = String((config as any)?.app?.frontendMode ?? 'pages')
        .trim()
        .toLowerCase()
    if (raw === 'pages' || raw === 'spa' || raw === 'none') return raw
    return 'pages'
}

type RegisterFrontendHostingArgs = {
    session: Pick<ISessionService, 'sessionExists'>
    stage: 'preApi' | 'postApi'
    config: IConfig
    i18n: II18nService
    log: ILogger
}

/**
 * Registra adaptadores de frontend opcionales.
 *
 * IMPORTANTE: el orden importa.
 * - pages mode debe ser registrado en el "preApi" stage (para que pueda tener sus propias rutas)
 * - spa mode debe ser registrado en el "postApi" stage (para que las rutas de API no sean sombreadas por el fallback SPA)
 */
export async function registerFrontendHosting(
    app: Application,
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
