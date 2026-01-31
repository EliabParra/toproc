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

    async exeRaw(sql: string, params?: unknown): Promise<{ rows: any[]; rowCount: number | null }> {
        this.connect()
        const paramsArray = Array.isArray(params) ? params : []
        const result = await this.pool!.query(sql, paramsArray)
        return { rows: result.rows, rowCount: result.rowCount }
    }

    async query<T extends Record<string, any> = any>(
        queryDef: string | { sql: string },
        params?: unknown[]
    ): Promise<{ rows: T[]; rowCount: number | null }> {
        const sql = typeof queryDef === 'string' ? queryDef : queryDef.sql
        return (await this.exeRaw(sql, params)) as { rows: T[]; rowCount: number | null }
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
