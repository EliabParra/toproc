// Bootstrap: Inicialización de servicios core.
// 100% Dependency Injection - No globals
import 'dotenv/config'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { container } from './core/Container.js'
import { ConfigLoader } from './config/index.js'
import { I18nService } from './services/I18nService.js'
import { FeatureFlags } from './config/FeatureFlags.js'
import { ValidatorService } from './services/ValidatorService.js'
import { AppLogger } from './services/LoggerService.js'
import { SecurityService } from './services/SecurityService.js'
import { SessionManager } from './services/SessionService.js'
import { EmailService } from './services/EmailService.js'
import { AppServer } from './api/AppServer.js'
import { AuditService } from './services/AuditService.js'
import { es } from './locales/es.js'
import { en } from './locales/en.js'

/**
 * Resuelve rutas relativas al directorio raíz del repositorio.
 *
 * @param parts - Segmentos de ruta a resolver
 * @returns Ruta absoluta resuelta desde la raíz del proyecto
 */
function repoPath(...parts: string[]): string {
    const srcDir = path.dirname(fileURLToPath(import.meta.url))
    const repoRoot = path.resolve(srcDir, '..')
    return path.resolve(repoRoot, ...parts)
}

// 1. Cargar configuración
const config = ConfigLoader.load(repoPath('.'))
container.register('config', config)

// 2. Inicializar I18n
const i18n = new I18nService(config.app.lang)
i18n.register('es', es)
i18n.register('en', en)
container.register('i18n', i18n)

// 3. Feature Flags
const features = new FeatureFlags(config)
container.register('features', features)

// 4. Validador (Zod)
const validator = new ValidatorService(i18n)
container.register('validator', validator)

// 5. Logger
const log = new AppLogger({ config })
container.register('log', log)

// 6. Base de Datos
import { DatabaseService } from './services/DatabaseService.js'
const db = new DatabaseService({ config, i18n, log: log })
container.register('db', db)

// 7. Capa de Servicios

// Auditoría
const audit = new AuditService({ db, log: log })
container.register('audit', audit)

// Servicio de Email
const email = new EmailService({ config, log })
container.register('email', email)

// Gestor de Sesiones
const session = new SessionManager({
    db,
    log,
    config,
    i18n,
    audit,
    validator,
})
container.register('session', session)

// Servicio de Seguridad
const security = new SecurityService({
    db,
    log,
    config,
    i18n,
    audit,
    session,
    validator,
    email,
})
container.register('security', security)

// AppServer (Punto de entrada HTTP)
const appServer = new AppServer({
    config,
    log,
    security,
    session,
    i18n,
    audit,
    db,
    validator,
    email,
})

// Exportar servicios
export { container, appServer, log, db, config, validator, session, security, i18n, email, audit }
