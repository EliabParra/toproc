import { Database } from './db.js'
import fs from 'node:fs/promises'
import path from 'path'
import colors from 'colors'

interface TableInfo {
    table_schema: string
    table_name: string
}

interface ColumnInfo {
    column_name: string
    data_type: string
    is_nullable: string
    column_default: string | null
}

/**
 * Introspector class - Reads database schema and generates TypeScript files.
 * Implements "DB -> Code" synchronization.
 */
export class Introspector {
    constructor(
        private db: Database,
        private outputDir: string
    ) {}

    /**
     * Lists all user tables in the database (excludes system schemas).
     */
    async listTables(): Promise<TableInfo[]> {
        const result = await this.db.exeRaw(`
            SELECT table_schema, table_name 
            FROM information_schema.tables 
            WHERE table_type = 'BASE TABLE'
              AND table_schema NOT IN ('pg_catalog', 'information_schema')
            ORDER BY table_schema, table_name
        `)
        return result.rows as TableInfo[]
    }

    /**
     * Gets column definitions for a specific table.
     */
    async getColumns(schema: string, table: string): Promise<ColumnInfo[]> {
        const result = await this.db.exeRaw(
            `
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_schema = $1 AND table_name = $2
            ORDER BY ordinal_position
        `,
            [schema, table]
        )
        return result.rows as ColumnInfo[]
    }

    /**
     * Generates a CREATE TABLE statement from column info.
     */
    private generateCreateTable(schema: string, table: string, columns: ColumnInfo[]): string {
        const colDefs = columns
            .map((col) => {
                let def = `        ${col.column_name} ${col.data_type}`
                if (col.is_nullable === 'NO') def += ' not null'
                if (col.column_default) def += ` default ${col.column_default}`
                return def
            })
            .join(',\n')

        return `create table if not exists ${schema}.${table} (\n${colDefs}\n    );`
    }

    /**
     * Generates a TypeScript schema file for a table.
     */
    generateSchemaFile(schema: string, table: string, columns: ColumnInfo[]): string {
        const createSql = this.generateCreateTable(schema, table, columns)
        const constName = `${table.toUpperCase()}_SCHEMA`

        return `/**
 * Auto-generated schema for ${schema}.${table}
 * Generated at: ${new Date().toISOString()}
 */
export const ${constName} = [
    \`${createSql}\`
]
`
    }

    /**
     * Introspects the entire database and generates schema files.
     */
    async introspectAll(): Promise<string[]> {
        console.log('\n🔍 Introspecting database...'.cyan)

        const tables = await this.listTables()
        console.log(`📊 Found ${tables.length} tables.`.green)

        const generatedFiles: string[] = []

        for (const table of tables) {
            const columns = await this.getColumns(table.table_schema, table.table_name)
            const content = this.generateSchemaFile(table.table_schema, table.table_name, columns)

            // Generate file name: schema_tablename.ts
            const filename = `auto_${table.table_schema}_${table.table_name}.ts`
            const filepath = path.join(this.outputDir, filename)

            await fs.writeFile(filepath, content, 'utf-8')
            console.log(`   ✅ Generated: ${filename}`.gray)
            generatedFiles.push(filepath)
        }

        console.log(`\n🎉 Generated ${generatedFiles.length} schema files.`.green.bold)
        return generatedFiles
    }

    /**
     * Detects tables that exist in DB but not in code (schema drift).
     */
    async detectNewTables(knownTables: string[]): Promise<TableInfo[]> {
        const allTables = await this.listTables()
        const knownSet = new Set(knownTables.map((t) => t.toLowerCase()))

        return allTables.filter(
            (t) => !knownSet.has(`${t.table_schema}.${t.table_name}`.toLowerCase())
        )
    }
}
