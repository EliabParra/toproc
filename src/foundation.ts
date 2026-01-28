// Bootstrap: Inicialización de servicios core.
// Reemplaza al antiguo globals.ts
import 'dotenv/config'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { container } from './core/Container.js'
import { ConfigLoader } from './config/index.js'
import { I18nService } from './services/I18nService.js'
import { FeatureFlags } from './config/FeatureFlags.js'
import { AppValidator } from './core/AppValidator.js'
import { AppLogger } from './services/LoggerService.js'
import { SecurityService } from './services/SecurityService.js'
import { SessionManager } from './services/SessionService.js'
import { EmailService } from './services/EmailService.js'
import { Dispatcher } from './api/Dispatcher.js'
import { AuditService } from './services/AuditService.js'

import { readFile } from 'node:fs/promises'

// Helper: Load JSON
async function loadJson(relativePath: string) {
    const p = new URL(relativePath, import.meta.url)
    return JSON.parse(await readFile(p, 'utf-8'))
}

async function loadJsonAbsolute(absPath: string) {
    return JSON.parse(await readFile(absPath, 'utf-8'))
}

function mergeQueries(base: any, extra: any) {
    if (!extra || typeof extra !== 'object') return base
    const out = { ...(base ?? {}) }
    for (const [schema, schemaQueries] of Object.entries(extra)) {
        if (!schemaQueries || typeof schemaQueries !== 'object') continue
        ;(out as any)[schema] = { ...((out as any)[schema] ?? {}), ...(schemaQueries as any) }
    }
    return out
}

function repoPath(...parts: string[]) {
    const srcDir = path.dirname(fileURLToPath(import.meta.url))
    const repoRoot = path.resolve(srcDir, '..')
    return path.resolve(repoRoot, ...parts)
}

function resolveRepoRelative(p: unknown) {
    const raw = String(p ?? '').trim()
    if (!raw) return null
    return path.isAbsolute(raw) ? raw : repoPath(raw)
}

// 1. Load Config
const config = ConfigLoader.load(repoPath('.'))
container.register('config', config)

// 2. Load Queries
const baseQueries = await loadJson('./config/queries.json')
let queries = baseQueries

if (process.env.QUERIES_EXTRA_PATH) {
    const extraPath = resolveRepoRelative(process.env.QUERIES_EXTRA_PATH)
    if (extraPath) queries = mergeQueries(queries, await loadJsonAbsolute(extraPath))
}
container.register('queries', queries)

// 3. Initialize I18n
const i18n = new I18nService(config.app.lang)
const localesPath = path.join(path.dirname(fileURLToPath(import.meta.url)), 'locales')
i18n.loadLocale('es', path.join(localesPath, 'es'))
i18n.loadLocale('en', path.join(localesPath, 'en'))
container.register('i18n', i18n)

// Legacy msgs object (needed by some components during transition)
const msgs = i18n.getLegacyObject()
container.register('msgs', msgs)

// 4. Feature Flags
const features = new FeatureFlags(config)
container.register('features', features)

// 5. Validator (Pure Zod - NO Legacy Adapter)
const validator = new AppValidator(i18n)
container.register('validator', validator)

// 6. Logger
const appLogger = new AppLogger({ config })
container.register('log', appLogger)

// 7. Database
const { default: DBComponent } = await import('./services/DatabaseService.js')
const db = new DBComponent({ config, msgs, queries, log: appLogger })
container.register('db', db)

// Legacy Globals removed: Use DI everywhere!

// 8. Service Layer Initialization

// Initialize Audit
const audit = new AuditService({ db })
container.register('audit', audit)

// Initialize Email Service
const email = new EmailService({ config, log: appLogger })
container.register('email', email)

// Initialize Session Manager
const session = new SessionManager({
    db,
    log: appLogger,
    config,
    msgs,
    email,
    audit,
    v: validator,
})
container.register('session', session)

// Initialize Security Service
// Initialize SecurityService
const security = new SecurityService({
    db,
    log: appLogger,
    config,
    msgs,
    audit,
    session,
    validator,
})
container.register('security', security)

// Initialize Dispatcher
const dispatcher = new Dispatcher({
    config,
    log: appLogger,
    security,
    session,
    msgs,
    audit,
    db,
})

// Export services
export { container, dispatcher, appLogger as log, db, config, validator, session, security, msgs }
