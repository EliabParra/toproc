import { SchemaLoader } from '../loaders/SchemaLoader.js'
import { Executor } from './executor.js'
import { Database } from './db.js'
import path from 'path'
import colors from 'colors'

export interface RunnerConfig {
    dryRun?: boolean
    interactive?: boolean
    profile?: string
    silent?: boolean
}

/**
 * Orchestrates the execution of database migrations/schemas.
 */
export class MigrationRunner {
    private loader: SchemaLoader

    constructor(
        private db: Database,
        private config: RunnerConfig,
        private schemasDir: string
    ) {
        this.loader = new SchemaLoader(schemasDir)
    }

    async run(): Promise<void> {
        console.log(`\n🔍 Scanning for schemas in: ${this.schemasDir}`.cyan)

        const files = await this.loader.listSchemaFiles()

        if (files.length === 0) {
            console.log('⚠️  No schema files found.'.yellow)
            return
        }

        console.log(`✨ Found ${files.length} schema files. Starting execution...\n`.green)

        const executor = new Executor(this.db, this.config.dryRun)

        for (const file of files) {
            const fileName = path.basename(file)
            console.log(`📄 Processing: ${fileName}`.bold)

            try {
                // Dynamically import the schema file
                // Windows path handling: file:// prefix needed for ESM import
                const fileUrl = path.sep === '\\' ? `file://${file}` : file
                const module = await import(fileUrl)

                // Extract the exported array (convention: Look for array exports)
                const schemaQueries = this.extractQueries(module)

                if (schemaQueries.length === 0) {
                    console.log(`   ⏭️  Skipping (No queries found)`.gray)
                    continue
                }

                // Execute generic SQL
                for (const sql of schemaQueries) {
                    await executor.run(sql, [], fileName)
                }
            } catch (err: any) {
                console.error(`❌ Error processing ${fileName}:`.red, err.message)
                throw err
            }
        }

        console.log(`\n✅ All migrations applied successfully.`.green.bold)
    }

    /**
     * Inspects the module exports to find the schema array.
     * Starts looking for specific naming conventions or takes the first array found.
     */
    private extractQueries(module: any): string[] {
        // 1. Look for known exports
        if (Array.isArray(module.BASE_SCHEMA)) return module.BASE_SCHEMA
        if (Array.isArray(module.USERS_SCHEMA)) return module.USERS_SCHEMA
        if (Array.isArray(module.GEO_SCHEMA)) return module.GEO_SCHEMA
        if (Array.isArray(module.AUDIT_SCHEMA)) return module.AUDIT_SCHEMA

        // 2. Fallback: Find first exported array
        const values = Object.values(module)
        const found = values.find((v) => Array.isArray(v) && v.every((i) => typeof i === 'string'))

        return (found as string[]) || []
    }
}
