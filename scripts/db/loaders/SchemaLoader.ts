import fs from 'node:fs/promises'
import path from 'node:path'

/**
 * Responsible for discovering and loading schema definition files.
 * Implements the "Auto-Discovery" pattern to avoid manual index.ts registration.
 */
export class SchemaLoader {
    constructor(public readonly directory: string) {}

    /**
     * Lists all valid schema files (.ts) in the directory, sorted alphanumerically.
     * @returns Array of absolute file paths
     */
    async listSchemaFiles(): Promise<string[]> {
        try {
            const entries = await fs.readdir(this.directory, { withFileTypes: true })

            const files = entries
                .filter((ent) => ent.isFile() && ent.name.endsWith('.ts'))
                .map((ent) => path.join(this.directory, ent.name))
                .sort() // Alphanumeric sort ensures 01_ runs before 02_

            return files
        } catch (error: any) {
            // Graceful handling for empty/missing dirs if needed, or throw
            if (error.code === 'ENOENT') return []
            throw error
        }
    }

    /**
     * Dynamic import simulation (In a real app, we would use import())
     * This is separated to allow easier testing/mocking if needed.
     */
    async loadModule(filePath: string): Promise<any> {
        return import(filePath)
    }
}
