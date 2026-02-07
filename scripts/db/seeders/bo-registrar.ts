import { Database } from '../core/db.js'
import fs from 'node:fs/promises'
import path from 'path'
import colors from 'colors'

interface BOMethod {
    name: string
    tx?: number
}

interface BOInfo {
    objectName: string
    methods: BOMethod[]
}

/**
 * Registers Business Objects and their methods into security.methods.
 */
export class BORegistrar {
    constructor(
        private db: Database,
        private boRoot: string
    ) {}

    /**
     * Discovers all BOs in the BO directory.
     */
    async discoverBOs(): Promise<BOInfo[]> {
        const bos: BOInfo[] = []

        try {
            const entries = await fs.readdir(this.boRoot, { withFileTypes: true })

            for (const entry of entries) {
                if (!entry.isDirectory()) continue

                const objectName = entry.name
                const boFilePath = path.join(this.boRoot, objectName, `${objectName}BO.ts`)

                try {
                    await fs.access(boFilePath)
                    const content = await fs.readFile(boFilePath, 'utf-8')
                    const methods = this.parseAsyncMethods(content)

                    if (methods.length > 0) {
                        bos.push({ objectName, methods: methods.map((name) => ({ name })) })
                    }
                } catch {
                    // BO file doesn't exist, skip
                }
            }
        } catch {
            // BO directory doesn't exist
        }

        return bos
    }

    /**
     * Parses async method names from a TypeScript BO file.
     */
    private parseAsyncMethods(content: string): string[] {
        const methods: string[] = []
        const regex = /\basync\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(/g
        let match: RegExpExecArray | null

        while ((match = regex.exec(content)) !== null) {
            const name = match[1]
            if (name && name !== 'constructor' && !name.startsWith('_')) {
                methods.push(name)
            }
        }

        return [...new Set(methods)] // Remove duplicates
    }

    /**
     * Registers all discovered BOs and their methods.
     */
    async registerAll(options: {
        profileId: number
        txStart?: number
    }): Promise<{ registered: number; bos: string[] }> {
        console.log(`\n📦 Registering Business Objects...`.cyan)

        // Verify profile exists before starting
        const profileExists = await this.checkProfileExists(options.profileId)
        if (!profileExists) {
            console.log(`   ❌ Error: Profile ID ${options.profileId} does not exist.`.red)
            console.log(
                `      Run 'pnpm run db seed --seedProfiles' first to initialize default profiles.`
                    .gray
            )
            throw new Error(`Profile ID ${options.profileId} not found.`)
        }

        const bos = await this.discoverBOs()

        if (bos.length === 0) {
            console.log(`   ⚠️  No BOs found in ${this.boRoot}`.yellow)
            return { registered: 0, bos: [] }
        }

        console.log(
            `   📊 Found ${bos.length} BOs: ${bos.map((b) => b.objectName).join(', ')}`.gray
        )

        // Get next available tx
        let nextTx = options.txStart ?? (await this.getNextTx())
        let registered = 0
        const boNames: string[] = []

        for (const bo of bos) {
            const objectId = await this.upsertObject(bo.objectName)

            for (const method of bo.methods) {
                const { methodId, tx } = await this.upsertMethod(objectId, method.name, nextTx)
                await this.grantPermission(options.profileId, methodId)
                registered++
                nextTx = Math.max(nextTx + 1, tx + 1)
            }

            boNames.push(bo.objectName)
            console.log(`   ✅ ${bo.objectName}: ${bo.methods.length} methods`.green)
        }

        console.log(`\n   📊 Total methods registered: ${registered}`.gray)
        return { registered, bos: boNames }
    }

    private async getNextTx(): Promise<number> {
        const result = await this.db.exeRaw(
            'SELECT COALESCE(MAX(tx), 0) + 1 AS next_tx FROM security.methods'
        )
        return Number(result.rows[0]?.next_tx) || 1
    }

    private async checkProfileExists(profileId: number): Promise<boolean> {
        const result = await this.db.exeRaw('SELECT 1 FROM security.profiles WHERE id = $1', [
            profileId,
        ])
        return (result.rowCount ?? 0) > 0
    }

    private async upsertObject(objectName: string): Promise<number> {
        const result = await this.db.exeRaw(
            `INSERT INTO security.objects (name) 
             VALUES ($1) 
             ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name 
             RETURNING id as object_id`,
            [objectName]
        )
        return result.rows[0]?.object_id
    }

    private async upsertMethod(
        objectId: number,
        methodName: string,
        tx: number
    ): Promise<{ methodId: number; tx: number }> {
        const result = await this.db.exeRaw(
            `INSERT INTO security.methods (object_id, name, tx) 
             VALUES ($1, $2, $3) 
             ON CONFLICT (object_id, name) DO UPDATE SET tx = security.methods.tx 
             RETURNING id as method_id, tx`,
            [objectId, methodName, tx]
        )
        return {
            methodId: result.rows[0]?.method_id,
            tx: Number(result.rows[0]?.tx),
        }
    }

    private async grantPermission(profileId: number, methodId: number): Promise<void> {
        await this.db.exeRaw(
            `INSERT INTO security.permission_methods (profile_id, method_id) 
             VALUES ($1, $2) 
             ON CONFLICT DO NOTHING`,
            [profileId, methodId]
        )
    }

    /**
     * Syncs methods between code and database.
     * - Registers new methods from code
     * - Optionally prunes orphaned methods (in DB but not in code)
     */
    async syncMethods(options: {
        profileId: number
        txStart?: number
        prune?: boolean
        dryRun?: boolean
    }): Promise<{
        added: number
        pruned: number
        orphaned: Array<{ objectName: string; methodName: string; tx: number }>
    }> {
        console.log(`\n🔄 Syncing Business Objects...`.cyan)

        const codeBOs = await this.discoverBOs()
        const dbMethods = await this.getDBMethods()

        // Build a set of "object.method" from code
        const codeMethodSet = new Set<string>()
        for (const bo of codeBOs) {
            for (const method of bo.methods) {
                codeMethodSet.add(`${bo.objectName}.${method.name}`)
            }
        }

        // Find orphaned methods (in DB but not in code)
        const orphaned = dbMethods.filter(
            (m) => !codeMethodSet.has(`${m.objectName}.${m.methodName}`)
        )

        // Register all methods from code (upsert)
        let added = 0
        if (!options.dryRun) {
            const result = await this.registerAll({
                profileId: options.profileId,
                txStart: options.txStart,
            })
            added = result.registered
        } else {
            console.log(`   📋 Dry run - would register methods from ${codeBOs.length} BOs`.gray)
            for (const bo of codeBOs) {
                console.log(`      • ${bo.objectName}: ${bo.methods.length} methods`.gray)
            }
        }

        // Report orphaned methods
        if (orphaned.length > 0) {
            console.log(
                `\n   ⚠️  Found ${orphaned.length} orphaned methods (in DB but not in code):`.yellow
            )
            for (const m of orphaned) {
                console.log(`      • ${m.objectName}.${m.methodName} (tx: ${m.tx})`.yellow)
            }

            if (options.prune && !options.dryRun) {
                console.log(`\n   🗑️  Pruning orphaned methods...`.red)
                for (const m of orphaned) {
                    await this.deleteMethod(m.methodId)
                    console.log(`      ✅ Deleted ${m.objectName}.${m.methodName}`.red)
                }
            } else if (options.prune && options.dryRun) {
                console.log(`   📋 Dry run - would delete ${orphaned.length} methods`.gray)
            } else {
                console.log(`   ℹ️  Use --prune to delete orphaned methods`.blue)
            }
        } else {
            console.log(`\n   ✅ No orphaned methods found - DB is in sync with code`.green)
        }

        return {
            added,
            pruned: options.prune && !options.dryRun ? orphaned.length : 0,
            orphaned: orphaned.map((m) => ({
                objectName: m.objectName,
                methodName: m.methodName,
                tx: m.tx,
            })),
        }
    }

    /**
     * Gets all methods currently registered in the database.
     */
    private async getDBMethods(): Promise<
        Array<{ methodId: number; objectName: string; methodName: string; tx: number }>
    > {
        const result = await this.db.exeRaw(`
            SELECT 
                m.id as method_id, 
                o.name as object_name, 
                m.name as method_name, 
                m.tx
            FROM security.methods m
            JOIN security.objects o ON o.id = m.object_id
            ORDER BY o.name, m.name
        `)

        return result.rows.map((row: any) => ({
            methodId: row.method_id,
            objectName: row.object_name,
            methodName: row.method_name,
            tx: Number(row.tx),
        }))
    }

    /**
     * Deletes a method and its associated permissions.
     */
    private async deleteMethod(methodId: number): Promise<void> {
        // First delete permissions
        await this.db.exeRaw('DELETE FROM security.permission_methods WHERE method_id = $1', [
            methodId,
        ])
        // Then delete the method
        await this.db.exeRaw('DELETE FROM security.methods WHERE id = $1', [methodId])
    }
}
