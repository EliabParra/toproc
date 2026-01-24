import { InitConfig, DEFAULT_CONFIG } from '../core/config.js'

export function parseCliArgs(argv: string[]): Partial<InitConfig> {
    const args: string[] = []
    const opts: Record<string, string | boolean> = {}

    for (let i = 0; i < argv.length; i++) {
        const a = argv[i]
        if (a.startsWith('--')) {
            const key = a.slice(2)
            const next = argv[i + 1]
            if (next == null || next.startsWith('--')) {
                opts[key] = true
            } else {
                opts[key] = next
                i++
            }
        } else {
            args.push(a)
        }
    }

    // Map CLI opts to Config structure
    const config: any = { app: {}, db: {}, auth: {}, security: {} }

    // Helper to get opt by multiple names
    const getOpt = (...keys: string[]) => {
        for (const k of keys) if (opts[k] !== undefined) return opts[k]
        return undefined
    }

    if (getOpt('yes', 'y')) config.app.interactive = false
    if (getOpt('dry', 'dry-run')) config.app.dryRun = true
    if (getOpt('silent')) config.app.silent = true

    const profile = getOpt('profile', 'p')
    if (typeof profile === 'string') config.app.profile = profile

    const host = getOpt('host', 'h')
    if (host) config.db.host = host
    if (opts.user) config.db.user = opts.user
    if (opts.password) config.db.password = opts.password
    if (opts.database) config.db.database = opts.database

    if (opts.auth) config.auth.enabled = true

    // ... map other opts as needed

    return config
}
