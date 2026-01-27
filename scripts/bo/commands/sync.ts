import { Context } from '../core/ctx.js'
import fs from 'node:fs/promises'
import path from 'node:path'
import { parseMethodsFromBO } from '../templates/bo.js'
import 'colors'

interface SyncOptions {
    all?: boolean
    isDryRun?: boolean
    prune?: boolean
    profileId?: number
}

interface MethodInfo {
    name: string
    status: 'exists' | 'new' | 'orphan'
    tx?: number
}

/**
 * Sync command - synchronizes BO methods with database
 */
export class SyncCommand {
    constructor(private ctx: Context) {}

    async run(objectName: string | undefined, opts: SyncOptions = {}) {
        const profileId = opts.profileId ?? 1

        if (opts.all) {
            await this.syncAll(opts)
            return
        }

        if (!objectName) {
            // List available BOs
            const bos = await this.discoverBOs()
            if (bos.length === 0) {
                console.log(`${'⚠️'.yellow} No BOs found in BO/ directory`.yellow)
                return
            }

            console.log(`\n${'📦'.cyan} Available BOs:`.cyan)
            for (const bo of bos) {
                console.log(`   • ${bo.objectName} (${bo.methods.length} methods)`.gray)
            }
            console.log(
                `\nRun: ${'npm run bo sync <Name>'.bold} or ${'npm run bo sync --all'.bold}`
            )
            return
        }

        await this.syncOne(objectName, opts)
    }

    private async syncOne(objectName: string, opts: SyncOptions) {
        const boDir = path.join(this.ctx.config.rootDir, 'BO', objectName)
        const boPath = path.join(boDir, `${objectName}BO.ts`)

        try {
            await fs.access(boPath)
        } catch {
            console.log(`${'❌'.red} BO not found: ${boPath}`.red)
            return
        }

        console.log(`\n${'🔄'.cyan} Syncing ${objectName}BO`.cyan.bold)
        console.log('══════════════════════════════════════════════════'.gray)

        // Parse methods from code
        const content = await fs.readFile(boPath, 'utf-8')
        const methods = parseMethodsFromBO(content)

        console.log(`\n${'📖'.blue} Scanning ${objectName}BO.ts...`)
        console.log(`   Found ${methods.length} methods: ${methods.join(', ')}`.gray)

        if (opts.isDryRun) {
            console.log(`\n${'📋'.blue} Dry run - would sync:`.gray)
            this.printMethodsTable(methods.map((m) => ({ name: m, status: 'new' as const })))
            console.log(`\n${'ℹ️'.blue} Run without --dry to apply changes`.gray)
            return
        }

        // Connect to DB and sync
        await this.ctx.ensureGlobals()

        const { BORegistrar } = await import('../../db/seeders/bo-registrar.js')
        const { Database } = await import('../../db/core/db.js')

        const db = new Database({
            host: process.env.PGHOST || 'localhost',
            port: Number(process.env.PGPORT) || 5432,
            user: process.env.PGUSER || 'postgres',
            password: process.env.PGPASSWORD || '',
            database: process.env.PGDATABASE || 'toproc',
        })

        try {
            const registrar = new BORegistrar(db, path.join(this.ctx.config.rootDir, 'BO'))

            const result = await registrar.syncMethods({
                profileId: opts.profileId ?? 1,
                prune: opts.prune,
                dryRun: false,
            })

            console.log(`\n${'🎉'.green} Sync complete!`.green.bold)
            console.log(`   • Methods registered: ${result.added}`)
            if (result.pruned > 0) {
                console.log(`   • Methods pruned: ${result.pruned}`.red)
            }
            if (result.orphaned.length > 0 && !opts.prune) {
                console.log(`   • Orphaned methods: ${result.orphaned.length}`.yellow)
                console.log(`     Run with --prune to remove them`.gray)
            }
        } finally {
            await db.close()
        }
    }

    private async syncAll(opts: SyncOptions) {
        console.log(`\n${'🔄'.cyan} Syncing ALL Business Objects`.cyan.bold)
        console.log('══════════════════════════════════════════════════'.gray)

        const bos = await this.discoverBOs()

        if (bos.length === 0) {
            console.log(`${'⚠️'.yellow} No BOs found`.yellow)
            return
        }

        console.log(`\n${'📊'.blue} Found ${bos.length} BOs:`)
        for (const bo of bos) {
            console.log(`   • ${bo.objectName}: ${bo.methods.length} methods`.gray)
        }

        if (opts.isDryRun) {
            console.log(`\n${'📋'.blue} Dry run - would sync all ${bos.length} BOs`.gray)
            return
        }

        await this.ctx.ensureGlobals()

        const { BORegistrar } = await import('../../db/seeders/bo-registrar.js')
        const { Database } = await import('../../db/core/db.js')

        const db = new Database({
            host: process.env.PGHOST || 'localhost',
            port: Number(process.env.PGPORT) || 5432,
            user: process.env.PGUSER || 'postgres',
            password: process.env.PGPASSWORD || '',
            database: process.env.PGDATABASE || 'toproc',
        })

        try {
            const registrar = new BORegistrar(db, path.join(this.ctx.config.rootDir, 'BO'))

            const result = await registrar.syncMethods({
                profileId: opts.profileId ?? 1,
                prune: opts.prune,
                dryRun: false,
            })

            console.log(`\n${'🎉'.green} All BOs synced!`.green.bold)
            console.log(`   • Total methods: ${result.added}`)
            if (result.orphaned.length > 0) {
                console.log(`   • Orphaned: ${result.orphaned.length}`.yellow)
            }
        } finally {
            await db.close()
        }
    }

    private async discoverBOs(): Promise<{ objectName: string; methods: string[] }[]> {
        const boRoot = path.join(this.ctx.config.rootDir, 'BO')
        const bos: { objectName: string; methods: string[] }[] = []

        try {
            const entries = await fs.readdir(boRoot, { withFileTypes: true })

            for (const entry of entries) {
                if (!entry.isDirectory()) continue

                const objectName = entry.name
                const boFilePath = path.join(boRoot, objectName, `${objectName}BO.ts`)

                try {
                    await fs.access(boFilePath)
                    const content = await fs.readFile(boFilePath, 'utf-8')
                    const methods = parseMethodsFromBO(content)

                    if (methods.length > 0) {
                        bos.push({ objectName, methods })
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

    private printMethodsTable(methods: MethodInfo[]) {
        const statusIcon = (s: string) => {
            if (s === 'exists') return '✅'.green
            if (s === 'new') return '🆕'.yellow
            if (s === 'orphan') return '🗑️'.red
            return '❓'
        }

        console.log('\n┌────────────────────┬──────────┬────────┐')
        console.log('│ Method             │ Status   │ TX     │')
        console.log('├────────────────────┼──────────┼────────┤')

        for (const m of methods) {
            const name = m.name.padEnd(18)
            const status = statusIcon(m.status) + ' ' + m.status.padEnd(6)
            const tx = m.tx ? String(m.tx).padEnd(6) : '—'.padEnd(6)
            console.log(`│ ${name} │ ${status} │ ${tx} │`)
        }

        console.log('└────────────────────┴──────────┴────────┘')
    }
}
