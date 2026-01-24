import pg from 'pg'
import { DbConfig } from './config.js'

export class Database {
    private pool: pg.Pool | null = null

    constructor(private config: DbConfig) {}

    connect() {
        if (this.pool) return

        const cfg = {
            host: this.config.host,
            port: this.config.port,
            database: this.config.database,
            user: this.config.user,
            password: this.config.password,
            ssl: this.config.ssl ? { rejectUnauthorized: false } : (false as any),
            connectionString: this.config.connectionString,
        }

        // Clean undefined
        Object.keys(cfg).forEach((key) => {
            if ((cfg as any)[key] === undefined) delete (cfg as any)[key]
        })

        this.pool = new pg.Pool(cfg)
    }

    async query(text: string, params: any[] = []): Promise<pg.QueryResult> {
        if (!this.pool) this.connect()
        return await this.pool!.query(text, params)
    }

    async close() {
        if (this.pool) {
            await this.pool.end()
            this.pool = null
        }
    }

    async testConnection(): Promise<boolean> {
        try {
            await this.query('SELECT 1')
            return true
        } catch (e) {
            return false
        }
    }
}
