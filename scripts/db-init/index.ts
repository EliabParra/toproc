import { parseCliArgs } from './cli/parser.js'
import { ConfigBuilder } from './core/config-builder.js'
import { Database } from './core/db.js'
import { Executor } from './core/executor.js'
import { Interactor } from './interactor/prompts.js'
import { BASE_SCHEMA } from './schema/base.js'
import { getAuthSchema } from './schema/auth.js'
import { AUDIT_SCHEMA } from './schema/audit.js'
import 'colors'

async function main() {
    const interactor = new Interactor()
    await interactor.header()

    try {
        // 1. Build Config
        const cliConfig = parseCliArgs(process.argv.slice(2))
        const builder = new ConfigBuilder(interactor)
        const config = await builder.build(cliConfig)

        // 2. Validate & Connect
        const db = new Database(config.db)
        if (config.app.dryRun) {
            console.log(`${'ℹ️  Dry Run: Skipping DB Connection Check'.blue}`)
        } else {
            if (await db.testConnection()) {
                console.log(`${'✅ Connected to DB'.green}`)
            } else {
                console.log(`${'❌ DB Connection Failed'.red}`)
                console.log(
                    `Host: ${config.db.host}, Port: ${config.db.port}, User: ${config.db.user}, DB: ${config.db.database}`
                )
                process.exit(1)
            }
        }

        // 3. Executor
        const executor = new Executor(db, config.app?.dryRun)

        // 4. Run Scripts
        // Base
        for (const sql of BASE_SCHEMA) {
            await executor.run(sql, [], 'Base Security Schema')
        }

        // Auth
        if (config.auth?.enabled) {
            for (const sql of getAuthSchema({ authUsername: config.auth.usernameSupported })) {
                await executor.run(sql, [], 'Auth Schema')
            }
        }

        // Audit
        for (const sql of AUDIT_SCHEMA) {
            await executor.run(sql, [], 'Audit Schema')
        }

        console.log(`\n${'🚀 DB Init Complete'.green.bold}\n`)

        // 5. Generators
        if (!config.app.dryRun) {
            try {
                // Dynamic import to avoid circular dep issues if any, or just standard import
                const { EnvGenerator } = await import('./generators/env.js')
                const { DocsGenerator } = await import('./generators/docs.js')

                await new EnvGenerator(config.app.rootDir).generate(config)
                await new DocsGenerator(config.app.rootDir).generate(config)
            } catch (genErr: any) {
                console.warn(`${'⚠️ Generator Warning'.yellow}: ${genErr.message}`)
            }
        } else {
            console.log(`${'ℹ️  (Dry Run - No files generated)'.blue}\n`)
        }
    } catch (err: any) {
        console.error(`\n${'❌ FATAL ERROR'.red.bold}: ${err.message}`)
        process.exit(1)
    } finally {
        interactor.close()
        // db.close() // if static
    }
}

main()
