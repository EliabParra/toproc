import { Database } from '../core/db.js'
import colors from 'colors'

/**
 * Resets the database by dropping and recreating all security tables.
 */
export class DatabaseResetter {
    constructor(private db: Database) {}

    /**
     * Drops all tables in the security schema and recreates it.
     * WARNING: This is destructive!
     */
    async reset(options: { confirm?: boolean } = {}): Promise<{ dropped: number }> {
        if (!options.confirm) {
            throw new Error('Reset requires explicit confirmation. Pass { confirm: true }')
        }

        console.log(`\n🗑️  Resetting database...`.red.bold)
        console.log(`   ⚠️  This will DROP all tables in security schema!`.yellow)

        // Get list of tables to drop
        const tablesResult = await this.db.exeRaw(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'security' AND table_type = 'BASE TABLE'
        `)
        const tables = tablesResult.rows.map((r) => r.table_name)

        if (tables.length === 0) {
            console.log(`   ℹ️  No tables found in security schema`.gray)
            return { dropped: 0 }
        }

        console.log(`   📋 Tables to drop: ${tables.join(', ')}`.gray)

        // Drop each table with CASCADE
        for (const table of tables) {
            await this.db.exeRaw(`DROP TABLE IF EXISTS security.${table} CASCADE`)
            console.log(`   ❌ Dropped: security.${table}`.red)
        }

        console.log(`\n   ✅ Reset complete. ${tables.length} tables dropped.`.green)
        return { dropped: tables.length }
    }

    /**
     * Truncates all tables in the security schema (keeps structure, deletes data).
     */
    async truncateAll(): Promise<{ truncated: number }> {
        console.log(`\n🧹 Truncating all security tables...`.yellow)

        const tablesResult = await this.db.exeRaw(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'security' AND table_type = 'BASE TABLE'
        `)
        const tables = tablesResult.rows.map((r) => r.table_name)

        for (const table of tables) {
            await this.db.exeRaw(`TRUNCATE TABLE security.${table} CASCADE`)
            console.log(`   🧹 Truncated: security.${table}`.gray)
        }

        return { truncated: tables.length }
    }
}
