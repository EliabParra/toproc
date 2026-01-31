// Bootstrap: Inicialización de servicios core.
// 100% Dependency Injection - No globals
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

// 2. Initialize QueryService (Legacy removed)
// 3. Initialize I18n (replaces legacy msgs)
// 3. Initialize I18n (replaces legacy msgs)
const i18n = new I18nService(config.app.lang)
import { es } from './locales/es.js'
import { en } from './locales/en.js'

i18n.register('es', es)
i18n.register('en', en)

container.register('i18n', i18n)

// 4. Feature Flags
const features = new FeatureFlags(config)
container.register('features', features)

// 5. Validator (Pure Zod)
const validator = new AppValidator(i18n)
container.register('validator', validator)

// 6. Logger
const appLogger = new AppLogger({ config })
container.register('log', appLogger)

// 7. Database
const { default: DBComponent } = await import('./services/DatabaseService.js')
const db = new DBComponent({ config, i18n, log: appLogger })
container.register('db', db)

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
    i18n,
    email,
    audit,
    v: validator,
})
container.register('session', session)

// Initialize SecurityService
const security = new SecurityService({
    db,
    log: appLogger,
    config,
    i18n,
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
    i18n,
    audit,
    db,
})

// Export services
export { container, dispatcher, appLogger as log, db, config, validator, session, security, i18n }
