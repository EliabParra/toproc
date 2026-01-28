import { container } from '../core/Container.js'

/**
 * Crea un contexto de aplicación con servicios inyectados.
 *
 * @returns {AppContext} Un objeto que contiene servicios inyectados.
 */
export function createAppContext(): AppContext {
    return {
        config: container.resolve('config'),
        log: container.resolve('log'),
        db: container.resolve('db'),
        queries: container.resolve('queries'),
        msgs: container.resolve('msgs'),
        v: container.resolve('v'),
        security: (globalThis as any).security,
    }
}
