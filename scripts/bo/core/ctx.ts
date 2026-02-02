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
            trace: (msg: string) => console.log(`[TRACE] ${msg}`),
            debug: (msg: string) => console.log(`[DEBUG] ${msg}`),
            info: (msg: string) => console.log(`[INFO] ${msg}`),
            warn: (msg: string) => console.warn(`[WARN] ${msg}`),
            error: (msg: string) => console.error(`[ERROR] ${msg}`),
            critical: (msg: string) => console.error(`[CRITICAL] ${msg}`),
            child: () => this.createMockLogger(),
        } as unknown as ILogger
    }

    // Lazy load globals if not present (simulating legacy script start)
    async ensureGlobals() {
        if (!this.db) {
            // Try to load from foundation first
            try {
                await import('../../../src/foundation.js')
            } catch (e) {
                // Ignore if foundation fails (e.g. strict mode or legacy issues)
            }

            this.db = (globalThis as any).db

            // If still no DB, create a standalone connection
            if (!this.db) {
                const { Database } = await import('../../db/core/db.js')
                this.db = new Database({
                    host: process.env.PGHOST || 'localhost',
                    port: Number(process.env.PGPORT) || 5432,
                    user: process.env.PGUSER || 'postgres',
                    password: process.env.PGPASSWORD || '',
                    database: process.env.PGDATABASE || 'toproc',
                })
            }

            this.log = (globalThis as any).log || this.createMockLogger()
        }
    }
}
