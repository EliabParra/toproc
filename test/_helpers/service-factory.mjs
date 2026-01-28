import { Dispatcher } from '../../src/api/Dispatcher.js'
import { SessionManager } from '../../src/services/SessionService.js'
import { AuditService } from '../../src/services/AuditService.js'
import { applySessionMiddleware } from '../../src/api/http/session/apply-session-middleware.js'

export function createTestDispatcher(globals) {
    const audit = new AuditService({ db: globals.db })

    // Simple email stub
    const emailStub = {
        sendLoginChallenge: async () => ({ ok: true, mode: 'log' }),
        sendPasswordReset: async () => ({ ok: true, mode: 'log' }),
        sendEmailVerification: async () => ({ ok: true, mode: 'log' }),
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
        msgs: globals.msgs,
        email: emailStub,
        audit: audit,
        v: globals.v,
    })

    const dispatcher = new Dispatcher({
        config: globals.config,
        log: globals.log,
        security: globals.security,
        session: session,
        msgs: globals.msgs,
        audit: audit,
        db: globals.db,
    })

    applySessionMiddleware(dispatcher.app, {
        config: globals.config,
        log: globals.log,
        db: globals.db,
    })

    return dispatcher
}
