import { AppServer } from '../../src/api/AppServer.js'
// ... import other deps if needed

// ...

export function createTestAppServer(globals) {
    // ... setup
    const appServer = new AppServer({
        // ... deps
        ...globals,
    })
    return appServer
}
import { SessionManager } from '../../src/services/SessionService.js'
import { AuditService } from '../../src/services/AuditService.js'
import { applySessionMiddleware } from '../../src/api/http/session/apply-session-middleware.js'

export function createTestAppServer(globals) {
    const audit = new AuditService({ db: globals.db })

    // Simple email stub
    const emailStub = {
        send: async () => ({ ok: true, mode: 'log' }),
        sendTemplate: async () => ({ ok: true, mode: 'log' }),
        maskEmail: (s) => {
            if (!s) return ''
            const [local, domain] = s.split('@')
            if (!domain) return s
            return `${local.slice(0, 2)}***@${domain}`
        },
    }

    const session = new SessionManager({
        db: globals.db,
        log: globals.log,
        config: globals.config,
        i18n: globals.i18n,
        email: emailStub,
        audit: audit,
        v: globals.v,
    })
    container.register('session', session)

    const appServer = new AppServer({
        config: globals.config,
        log: globals.log,
        security: globals.security,
        session: session,
        i18n: globals.i18n,
        audit: audit,
        db: globals.db,
    })

    applySessionMiddleware(appServer.app, {
        config: globals.config,
        log: globals.log,
        db: globals.db,
    })

    return appServer
}
