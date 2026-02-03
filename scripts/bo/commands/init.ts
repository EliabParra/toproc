import { Context } from '../core/ctx.js'
import { Interactor } from '../interactor/ui.js'
import fs from 'node:fs/promises'
import path from 'node:path'
import 'colors'

interface InitOptions {
    isDryRun?: boolean
}

/**
 * Init command - project setup wizard
 */
export class InitCommand {
    private interactor: Interactor

    constructor(private ctx: Context) {
        this.interactor = new Interactor()
    }

    async run(opts: InitOptions = {}) {
        console.log(`\n🚀 ToProccess BO Setup Wizard`.cyan.bold)
        console.log('══════════════════════════════════════════════════'.gray)
        console.log('')

        // Check if BO directory exists
        const boRoot = path.join(this.ctx.config.rootDir, 'BO')
        let boExists = false
        try {
            await fs.access(boRoot)
            boExists = true
        } catch {}

        if (boExists) {
            const entries = await fs.readdir(boRoot, { withFileTypes: true })
            const boCount = entries.filter((e) => e.isDirectory()).length

            if (boCount > 0) {
                console.log(`ℹ️  Found ${boCount} existing BO(s) in BO/`)
                console.log('')
            }
        }

        // Step 1: Create initial BO
        console.log('📋 Step 1: Create your first Business Object')
        console.log('')

        const createFirst = await this.interactor.confirm('Create a new BO now?', true)

        if (createFirst) {
            const name = await this.interactor.ask('BO name (PascalCase)', 'Product')

            if (!name) {
                console.log(`⚠️ Name required`)
                this.interactor.close()
                return
            }

            // Choose preset
            console.log('')
            console.log('📦 Choose a preset:')
            console.log('   1. CRUD (get, getAll, create, update, delete)')
            console.log('   2. ReadOnly (get, getAll)')
            console.log('   3. Minimal (get)')
            console.log('   4. Custom')

            const preset = await this.interactor.ask('Select preset', '1')

            let methods: string[]
            switch (preset) {
                case '1':
                    methods = ['get', 'getAll', 'create', 'update', 'delete']
                    break
                case '2':
                    methods = ['get', 'getAll']
                    break
                case '3':
                    methods = ['get']
                    break
                case '4':
                    const custom = await this.interactor.ask(
                        'Methods (comma-separated)',
                        'get,getAll,create,update,delete'
                    )
                    methods = custom
                        .split(',')
                        .map((m) => m.trim())
                        .filter((m) => m)
                    break
                default:
                    methods = ['get', 'getAll', 'create', 'update', 'delete']
            }

            if (opts.isDryRun) {
                console.log(`\n${'📋'.blue} Dry run - would create:`)
                console.log(`   BO/${name}/`)
                console.log(`   • ${name}BO.ts`)
                console.log(`   • ${name}Service.ts`)
                console.log(`   • ... (9 files total)`)
            } else {
                // Import and run new command
                const { NewCommand } = await import('./new.js')
                await new NewCommand(this.ctx).run(name, { methods: methods.join(',') })
            }
        }

        // Step 2: Database setup reminder
        console.log('')
        console.log('📋 Step 2: Database Setup')
        console.log('')
        console.log('Make sure your database is configured:')
        console.log('')
        console.log('   1. Set environment variables:'.gray)
        console.log('      PGHOST, PGPORT, PGDATABASE, PGUSER, PGPASSWORD'.gray)
        console.log('')
        console.log('   2. Initialize database:'.gray)
        console.log(`      ${'pnpm run db'.bold}`.gray)
        console.log('')

        // Step 3: Sync methods
        console.log('📋 Step 3: Register BO Methods')
        console.log('')
        console.log('After creating BOs, sync them to the database:')
        console.log(`   ${'pnpm run bo sync --all'.bold}`.gray)
        console.log('')

        // Step 4: Set permissions
        console.log('📋 Step 4: Configure Permissions')
        console.log('')
        console.log('Manage permissions for each BO:')
        console.log(`   ${'pnpm run bo perms <Name>'.bold}`.gray)
        console.log('')

        // Summary
        console.log('══════════════════════════════════════════════════'.gray)
        console.log('')
        console.log('🎉 Setup complete! Quick reference:'.green.bold)
        console.log('')
        console.log('┌───────────────────────────────────────────────────┐')
        console.log('│ Command                      │ Description        │')
        console.log('├───────────────────────────────────────────────────┤')
        console.log('│ pnpm run bo new <Name>        │ Create new BO      │')
        console.log('│ pnpm run bo list              │ List all BOs       │')
        console.log('│ pnpm run bo sync --all        │ Sync methods to DB │')
        console.log('│ pnpm run bo perms <Name>      │ Manage permissions │')
        console.log('│ pnpm run bo analyze           │ Health check       │')
        console.log('│ pnpm run bo auth              │ Generate Auth      │')
        console.log('└───────────────────────────────────────────────────┘')
        console.log('')

        this.interactor.close()
    }
}
