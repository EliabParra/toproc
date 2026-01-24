import { Interactor } from './interactor/ui.js'
import { Context } from './core/ctx.js'
import { ListCommand } from './commands/list.js'
import { NewCommand } from './commands/new.js'
import { SyncCommand } from './commands/sync.js'
import { AuthCommand } from './commands/auth.js'
import { PermsCommand } from './commands/perms.js'
import 'colors'

async function main() {
    const interactor = new Interactor()
    interactor.header()

    const args = process.argv.slice(2)
    const command = args[0]

    // Simple arg parser
    const opts = {
        isDryRun: args.includes('--dry'),
        isInteractive: !args.includes('--yes'),
        all: args.includes('--all'),
        rootDir: process.cwd(),
    }

    const ctx = new Context(opts)

    try {
        switch (command) {
            case 'list':
                await new ListCommand(ctx).run()
                break
            case 'new':
                const name = args[1]
                if (!name) throw new Error('Specify name')
                await new NewCommand(ctx).run(name, { methods: 'get,create' })
                break
            case 'sync':
                await new SyncCommand(ctx).run(args[1], opts)
                break
            case 'auth':
                await new AuthCommand(ctx).run(opts)
                break
            case 'perms':
                await new PermsCommand(ctx).run()
                break
            default:
                console.log('Usage: npm run bo <command> [args]')
                console.log('Commands: list, new, sync, auth, perms')
        }
    } catch (e: any) {
        console.error('Error:', e.message)
    } finally {
        interactor.close()
    }
}

main()
