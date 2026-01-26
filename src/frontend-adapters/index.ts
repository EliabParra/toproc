function getFrontendMode() {
    const raw = String((config as any)?.app?.frontendMode ?? 'pages')
        .trim()
        .toLowerCase()
    if (raw === 'pages' || raw === 'spa' || raw === 'none') return raw
    return 'pages'
}

type RegisterFrontendHostingArgs = {
    session: any
    stage: 'preApi' | 'postApi'
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
    { session, stage }: RegisterFrontendHostingArgs
) {
    const mode = getFrontendMode()

    if (mode === 'none') return

    if (stage === 'preApi' && mode === 'pages') {
        const { registerPagesHosting } = await import('./pages.adapter.js')
        await registerPagesHosting(app, { session })
        return
    }

    if (stage === 'postApi' && mode === 'spa') {
        const { registerSpaHosting } = await import('./spa.adapter.js')
        await registerSpaHosting(app)
    }
}
