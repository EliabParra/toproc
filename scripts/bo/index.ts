import { Interactor } from './interactor/ui.js'
import { Context } from './core/ctx.js'
import { ListCommand } from './commands/list.js'
import { NewCommand } from './commands/new.js'
import { SyncCommand } from './commands/sync.js'
import { AuthCommand } from './commands/auth.js'
import { PermsCommand } from './commands/perms.js'
import { AnalyzeCommand } from './commands/analyze.js'
import { InitCommand } from './commands/init.js'
import 'colors'

const VERSION = '2.0.0'

const HELP_TEXT = `
${'📦 ToProccess BO CLI'.cyan.bold} v${VERSION}

${'Usage:'.bold}
  npm run bo <command> [options]
  npm run bo                      # Interactive menu

${'Commands:'.bold}
  new <name>     Create a new Business Object (7 files)
  list           List all registered BOs
  sync [name]    Sync BO methods to database
  perms [name]   Manage permissions for a BO
  auth           Generate Auth preset module
  analyze [name] Health check for BOs
  init           Project setup wizard

${'Options:'.bold}
  --methods, -m  Methods to generate (comma-separated)
                 Default: get,create,update,delete
  --dry, -d      Dry run (show what would happen)
  --yes, -y      Non-interactive mode (accept defaults)
  --all          Sync all BOs (with sync command)
  --help, -h     Show this help message

${'Examples:'.bold}
  npm run bo new Product
  npm run bo new Invoice --methods "create,list,search"
  npm run bo sync Product
  npm run bo sync --all
  npm run bo perms Product
  npm run bo new Order --dry

${'Generated Files:'.bold} (7 files per BO)
  📦 {Name}BO.ts             Main Business Object
  🧠 {Name}.Service.ts       Business logic layer
  🗄️ {Name}.Repository.ts    Database access layer
  ✅ {Name}.Schemas.ts        Zod validations
  📘 {Name}.Types.ts          TypeScript interfaces
  💬 {Name}.Messages.ts       User-facing strings
  ❌ {Name}.Errors.ts         Custom error classes
`

const MENU_OPTIONS = [
    { key: 'new', label: '🆕 Create new Business Object', value: 'new' },
    { key: 'list', label: '📋 List all BOs', value: 'list' },
    { key: 'sync', label: '🔄 Sync BO methods to DB', value: 'sync' },
    { key: 'perms', label: '🔐 Manage permissions', value: 'perms' },
    { key: 'auth', label: '🔑 Generate Auth preset', value: 'auth' },
    { key: 'analyze', label: '🔍 BO health check', value: 'analyze' },
    { key: 'init', label: '🚀 Setup wizard', value: 'init' },
    { key: 'exit', label: '❌ Exit', value: 'exit' },
]

async function parseArgs(args: string[]) {
    const opts = {
        command: args[0] || '',
        name: '',
        isDryRun: args.includes('--dry') || args.includes('-d'),
        isInteractive: !args.includes('--yes') && !args.includes('-y'),
        all: args.includes('--all'),
        methods: 'get,create,update,delete',
        showHelp: args.includes('--help') || args.includes('-h'),
        rootDir: process.cwd(),
    }

    // Extract name (first non-flag arg after command)
    for (let i = 1; i < args.length; i++) {
        if (!args[i].startsWith('-')) {
            opts.name = args[i]
            break
        }
    }

    // Extract methods
    const methodsIdx = args.findIndex((a) => a === '--methods' || a === '-m')
    if (methodsIdx !== -1 && args[methodsIdx + 1]) {
        opts.methods = args[methodsIdx + 1]
    }

    return opts
}

async function interactiveMenu(interactor: Interactor): Promise<string> {
    console.log('')
    console.log('? What would you like to do?'.bold)

    for (let i = 0; i < MENU_OPTIONS.length; i++) {
        console.log(`  ${String(i + 1).gray}. ${MENU_OPTIONS[i].label}`)
    }

    const answer = await interactor.ask('Select option', '1')
    const idx = parseInt(answer) - 1

    if (idx >= 0 && idx < MENU_OPTIONS.length) {
        return MENU_OPTIONS[idx].value
    }

    return 'exit'
}

async function handleNewInteractive(ctx: Context, interactor: Interactor) {
    const name = await interactor.ask('Enter BO name (PascalCase)')
    if (!name) {
        interactor.error('Name is required')
        return
    }

    const defaultMethods = ['get', 'create', 'update', 'delete', 'list', 'search']
    const selectedMethods = await interactor.multiSelect(
        'Select methods to generate',
        defaultMethods,
        ['get', 'create', 'update', 'delete']
    )

    if (selectedMethods.length === 0) {
        interactor.error('At least one method is required')
        return
    }

    await new NewCommand(ctx).run(name, { methods: selectedMethods.join(',') })
}

async function main() {
    const interactor = new Interactor()
    const args = process.argv.slice(2)
    const opts = await parseArgs(args)

    // Show help
    if (opts.showHelp) {
        console.log(HELP_TEXT)
        return
    }

    interactor.header()

    const ctx = new Context({
        isDryRun: opts.isDryRun,
        isInteractive: opts.isInteractive,
        all: opts.all,
        rootDir: opts.rootDir,
    })

    try {
        let command = opts.command

        // Interactive menu if no command
        if (!command && opts.isInteractive) {
            command = await interactiveMenu(interactor)
        }

        switch (command) {
            case 'new':
                if (opts.isInteractive && !opts.name) {
                    await handleNewInteractive(ctx, interactor)
                } else {
                    if (!opts.name) throw new Error('Specify name: npm run bo new <Name>')
                    await new NewCommand(ctx).run(opts.name, { methods: opts.methods })
                }
                break

            case 'list':
                await new ListCommand(ctx).run()
                break

            case 'sync':
                await new SyncCommand(ctx).run(opts.name || undefined, opts)
                break

            case 'auth':
                await new AuthCommand(ctx).run(opts)
                break

            case 'perms':
                await new PermsCommand(ctx).run()
                break

            case 'analyze':
                await new AnalyzeCommand(ctx).run(opts.name || undefined)
                break

            case 'init':
                await new InitCommand(ctx).run(opts)
                break

            case 'exit':
                console.log('👋 Bye!'.gray)
                break

            default:
                if (command) {
                    interactor.error(`Unknown command: ${command}`)
                }
                console.log('Run with --help for usage information'.gray)
        }
    } catch (e: any) {
        interactor.error(e.message)
    } finally {
        interactor.close()
    }
}

main()
