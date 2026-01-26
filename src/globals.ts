/**
 * Definición de variables globales y contenedor DI legacy.
 *
 * Configura `globalThis` con accesores para compatibilidad hacia atrás
 * y registra servicios en el contenedor de inyección de dependencias.
 *
 * @module Globals
 * @since 1.0.0
 * @author Team ToProccess
 * @license MIT
 */
import 'dotenv/config'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const g = globalThis as unknown as {
    require?: any
    config?: any
    queries?: any
    msgs?: any
    v?: any
    log?: any
    db?: any
    i18n?: any
    validator?: any
    features?: any
}

g.require = createRequire(import.meta.url)

import { ConfigLoader } from './config/index.js'

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

g.config = ConfigLoader.load(repoPath('.'))

const baseQueries = g.require('./config/queries.json')
let queries = baseQueries

// Optional: merge additional queries (absolute path or repo-relative).
// Example: QUERIES_EXTRA_PATH=./src/config/queries.extra.json
if (process.env.QUERIES_EXTRA_PATH) {
    const extraPath = resolveRepoRelative(process.env.QUERIES_EXTRA_PATH)
    if (extraPath) queries = mergeQueries(queries, g.require(extraPath))
}
g.queries = queries

import { I18nService } from './core/i18n/I18nService.js'

// g.msgs = g.require('./config/messages.json') // Legacy
const i18n = new I18nService(g.config.app.lang)
const localesPath = path.join(path.dirname(fileURLToPath(import.meta.url)), 'locales')
i18n.loadLocale('es', path.join(localesPath, 'es'))
i18n.loadLocale('en', path.join(localesPath, 'en'))

g.i18n = i18n
// Legacy g.msgs needed to be { es: { ... }, en: { ... } } because DBComponent uses msgs[lang].
g.msgs = i18n.getLegacyObject()

// Feature Flags
import { FeatureFlags, Feature } from './core/flags/FeatureFlags.js'
g.features = new FeatureFlags(g.config)
container.register('features', g.features)

import { AppValidator } from './core/validation/AppValidator.js'
import { LegacyValidatorAdapter } from './core/validation/integration/LegacyValidatorAdapter.js'

g.validator = new AppValidator(i18n)

// Choose Legacy Validator implementation based on Feature Flag
// If USE_NEW_VALIDATOR is true, use the Adapter (Zod backend).
// Else use the old implementation (imported below).
// Note: We can import both, but only instantiate one for g.v
// However, to be safe during transition, let's load legacy class too.

const { default: LegacyValidatorImpl } = await import('./utils/Validator.js')

if (g.features.isEnabled(Feature.USE_NEW_VALIDATOR)) {
    g.v = new LegacyValidatorAdapter(g.validator)
} else {
    g.v = new LegacyValidatorImpl(g.config, g.msgs)
}

// const { default: Log } = await import('./BSS/Log.js') // REPLACED
import { AppLogger } from './logger/AppLogger.js'
const { default: DBComponent } = await import('./db/DBComponent.js')

// g.log = new Log(g.config)
g.log = new AppLogger({ config: g.config })
g.db = new DBComponent({ config: g.config, msgs: g.msgs, queries: g.queries, log: g.log })

// Auto-register legacy globals into the new DI Container
// This bridges the gap during refactoring
import { container } from './core/Container.js'
container.register('config', g.config)
container.register('msgs', g.msgs)
container.register('queries', g.queries)
container.register('v', g.v)
container.register('validator', g.validator)
container.register('log', g.log)
container.register('db', g.db)

// NOTE:
// Do NOT instantiate Security here.
// Security's constructor triggers async init which queries the DB.
// That breaks CLI scripts that import globals for config/db/log (e.g. scripts/bo.ts).
// Server startup (src/index.ts) is responsible for creating globalThis.security.
