import readline from 'node:readline/promises'
import 'colors'

export class Interactor {
    private rl: readline.Interface

    constructor() {
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        })
    }

    close() {
        this.rl.close()
    }

    header() {
        console.log('')
        console.log('📦 ToProccess Business Object CLI'.cyan.bold)
        console.log('================================================'.gray)
        console.log('Manage your Business Objects, Permissions, and DB Sync'.gray)
        console.log('')
    }

    async ask(question: string, defaultValue?: string): Promise<string> {
        const def = defaultValue ? ` (${defaultValue.dim})` : ''
        const q = `${'➜'.green} ${question.bold}${def}: `
        const ans = await this.rl.question(q)
        return ans.trim() || defaultValue || ''
    }

    async confirm(question: string, defaultYes = true): Promise<boolean> {
        const yn = defaultYes ? '[Y/n]' : '[y/N]'
        const ans = await this.ask(`${question} ${yn}`, defaultYes ? 'y' : 'n')
        return ['y', 'yes'].includes(ans.toLowerCase())
    }

    async select(question: string, options: string[], defaultOption?: string): Promise<string> {
        console.log(`${'➜'.green} ${question.bold}:`)
        options.forEach((opt, i) => {
            console.log(`  ${i + 1}. ${opt}`)
        })

        while (true) {
            const ans = await this.ask(
                `Select (1-${options.length})`,
                defaultOption ? String(options.indexOf(defaultOption) + 1) : undefined
            )
            const idx = parseInt(ans) - 1
            if (idx >= 0 && idx < options.length) {
                return options[idx]
            }
            console.log(`${'⚠'.yellow} Invalid selection`)
        }
    }
}
