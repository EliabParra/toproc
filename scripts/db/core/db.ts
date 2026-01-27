import pg from 'pg'
import { IDatabase } from '../../../src/types/core.js'

export interface DbConfig {
    connectionString?: string
    host?: string
    port?: number
    database?: string
    user?: string
    password?: string
    ssl?: boolean
}

/**
 * Lightweight Database wrapper for CLI scripts.
 * Implements IDatabase interface for compatibility with Executor.
 */
export class Database implements IDatabase {
    private pool: pg.Pool | null = null

    constructor(private config: DbConfig) {}

    private connect() {
        if (this.pool) return

        const cfg: any = {
            host: this.config.host,
            port: this.config.port,
            database: this.config.database,
            user: this.config.user,
            password: this.config.password,
            ssl: this.config.ssl ? { rejectUnauthorized: false } : false,
            connectionString: this.config.connectionString,
        }

        // Clean undefined values
        Object.keys(cfg).forEach((key) => {
            if (cfg[key] === undefined) delete cfg[key]
        })

        this.pool = new pg.Pool(cfg)
    }

    async exe(
        schema: string,
        query: string,
        params?: unknown
    ): Promise<{ rows: any[]; rowCount: number | null }> {
        // For CLI, we don't use the query store, so this is a passthrough stub
        throw new Error('exe() is not supported in CLI mode. Use exeRaw() instead.')
    }

    async exeRaw(sql: string, params?: unknown): Promise<{ rows: any[]; rowCount: number | null }> {
        this.connect()
        const paramsArray = Array.isArray(params) ? params : []
        const result = await this.pool!.query(sql, paramsArray)
        return { rows: result.rows, rowCount: result.rowCount }
    }

    async exeNamed(
        schema: string,
        query: string,
        paramsObj: unknown,
        orderKeys: unknown[],
        opts?: { strict?: boolean; enforceSqlArity?: boolean }
    ): Promise<{ rows: any[]; rowCount: number | null }> {
        throw new Error('exeNamed() is not supported in CLI mode. Use exeRaw() instead.')
    }

    async close() {
        if (this.pool) {
            await this.pool.end()
            this.pool = null
        }
    }

    async testConnection(): Promise<boolean> {
        try {
            await this.exeRaw('SELECT 1')
            return true
        } catch (e) {
            return false
        }
    }
}
