import type { IDatabase, ILogger } from '../../../src/types/core.js'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

export interface BoConfig {
    rootDir: string
    isInteractive: boolean
    isDryRun: boolean
    all?: boolean
}

export class Context {
    public db: IDatabase
    public log: ILogger
    public config: BoConfig

    constructor(config: BoConfig) {
        this.config = config
        // Mock or real dep injection based on need.
        this.db = (globalThis as any).db
        this.log = (globalThis as any).log || this.createMockLogger()
    }

    private createMockLogger(): ILogger {
        return {
            show: (opts: any) => console.log(`[${opts.type || 'INFO'}] ${opts.msg}`),
            error: (e: any) => console.error(e),
            TYPE_INFO: 'INFO',
            TYPE_ERROR: 'ERROR',
            TYPE_WARNING: 'WARN',
            TYPE_SUCCESS: 'SUCCESS',
        } as any
    }

    // Lazy load globals if not present (simulating legacy script start)
    async ensureGlobals() {
        if (!this.db) {
            // Load valid config
            // Connect DB
            // Assign to this.db
            // For now, assume migration to use unified `npm run db` CLI?
            // Or stick to `src/globals` logic?
            // Let's stick to importing globals.js in index.ts for simplicity.
            await import('../../../src/foundation.js')
            this.db = (globalThis as any).db
            this.log = (globalThis as any).log
        }
    }
}
