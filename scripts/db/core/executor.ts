import { IDatabase } from '../../../src/types/core.js'
import 'colors'

export class Executor {
    private history: Array<{ sql: string; params: any[] }> = []

    constructor(
        private db: IDatabase,
        private dryRun: boolean = false
    ) {}

    async run(sql: string, params: any[] = [], description?: string): Promise<any> {
        if (description) {
            console.log(`  ${'RUN'.gray} ${description}`)
        }

        if (this.dryRun) {
            console.log(`    ${'SQL'.gray}: ${sql.replace(/\n/g, ' ').substring(0, 80)}...`)
            return { rows: [], rowCount: 0 }
        }

        try {
            this.history.push({ sql, params })
            return await this.db.exeRaw(sql, params)
        } catch (error: any) {
            console.error(`${'ERROR'.red}: Failed to execute SQL`)
            console.error(`SQL: ${sql}`)
            console.error(`Params: ${JSON.stringify(params)}`)
            console.error(`Error: ${error.message}`)
            throw error
        }
    }

    // TODO: Rollback functionality would require maintaining inverse operations or using DB transaction if all in one connection.
    // For DDL, rollback is harder.
}
