import './globals.js' // Populates container with foundation (db, log, config, etc.)
import { container } from './core/Container.js'
import { SecurityService } from './security/SecurityService.js'
import { SessionManager } from './session/SessionManager.js'
import { EmailService } from './email/EmailService.js'
import { DispatcherService } from './dispatcher/DispatcherService.js'
import { AuditService } from './audit/AuditService.js'
import { AppLogger } from './logger/AppLogger.js'

// 0. Initialize Logger & Audit
const audit = new AuditService({ db: container.resolve('db') })
container.register('audit', audit)

// Overwrite legacy log with new AppLogger
const appLogger = new AppLogger({ config: container.resolve('config') })
container.register('log', appLogger)

// 1. Initialize Email Service
const email = new EmailService({
    config: container.resolve('config'),
    log: container.resolve('log'),
})
container.register('email', email)

// 2. Initialize Session Manager
const session = new SessionManager({
    db: container.resolve('db'),
    log: container.resolve('log'),
    config: container.resolve('config'),
    msgs: container.resolve('msgs'),
    email: email,
    audit: audit,
    v: container.resolve('v'),
})
container.register('session', session)

// 3. Initialize Security Service
const security = new SecurityService({
    db: container.resolve('db'),
    log: container.resolve('log'),
    config: container.resolve('config'),
    msgs: container.resolve('msgs'),
})
container.register('security', security)

// Bridge legacy global security
;(globalThis as unknown as { security: unknown }).security = security

// 4. Initialize Dispatcher
const dispatcher = new DispatcherService({
    config: container.resolve('config'),
    log: container.resolve('log'),
    security: security,
    session: session,
    msgs: container.resolve('msgs'),
    audit: audit,
    db: container.resolve('db'),
})

// Wait for async inits
await security.ready
await dispatcher.init()

dispatcher.serverOn()

// Shutdown handling
let shuttingDown = false
const log = container.resolve<any>('log') // Resolve logger for shutdown messages

async function shutdown(signal: string) {
    if (shuttingDown) return
    shuttingDown = true
    try {
        log.show({ type: log.TYPE_INFO, msg: `Shutting down (${signal})...` })
        await dispatcher.shutdown()
        process.exit(0)
    } catch (err: any) {
        try {
            log.show({ type: log.TYPE_ERROR, msg: `Shutdown error: ${err?.message ?? err}` })
        } catch {}
        process.exit(1)
    }
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))
