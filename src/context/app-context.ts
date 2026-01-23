import { container } from '../core/Container.js'

export function createAppContext(): AppContext {
    return {
        config: container.resolve('config'),
        log: container.resolve('log'),
        db: container.resolve('db'),
        queries: container.resolve('queries'),
        msgs: container.resolve('msgs'),
        v: container.resolve('v'),
        security: (globalThis as any).security, // Security is still lazy-loaded in index.ts/Security.ts
    }
}
