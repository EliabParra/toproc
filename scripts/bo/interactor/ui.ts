import readline from 'node:readline/promises'
import 'colors'

/**
 * Interactive UI for BO CLI
 * Provides beautiful console output and user prompts
 */
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

    // ============================================================
    // Headers & Dividers
    // ============================================================

    header() {
        console.log('')
        console.log('📦 ToProccess BO CLI'.cyan.bold)
        console.log('══════════════════════════════════════════════════'.gray)
        console.log('Manage Business Objects, Permissions, and DB Sync'.gray)
        console.log('')
    }

    divider() {
        console.log('──────────────────────────────────────────────────'.gray)
    }

    // ============================================================
    // Input Methods
    // ============================================================

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
            const marker = defaultOption === opt ? '❯'.cyan : ' '
            console.log(`  ${marker} ${String(i + 1).gray}. ${opt}`)
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

    async multiSelect(
        question: string,
        options: string[],
        defaults: string[] = []
    ): Promise<string[]> {
        const selected = new Set<string>(defaults)

        console.log(`${'➜ '.green} ${question.bold}:`)
        console.log('   Use numbers to toggle, Enter when done'.gray)

        const printOptions = () => {
            options.forEach((opt, i) => {
                const checked = selected.has(opt) ? '◉'.green : '◯'.gray
                console.log(`  ${checked} ${String(i + 1).gray}. ${opt}`)
            })
        }

        printOptions()

        while (true) {
            const ans = await this.ask('Toggle or Enter to confirm', '')

            if (ans === '') {
                return Array.from(selected)
            }

            const idx = parseInt(ans) - 1
            if (idx >= 0 && idx < options.length) {
                const opt = options[idx]
                if (selected.has(opt)) {
                    selected.delete(opt)
                } else {
                    selected.add(opt)
                }
                // Reprint
                console.log('')
                printOptions()
            } else {
                console.log(`${'⚠'.yellow} Invalid selection`)
            }
        }
    }

    // ============================================================
    // Output Methods
    // ============================================================

    success(message: string) {
        console.log(`${'✅'.green} ${message.green}`)
    }

    error(message: string) {
        console.log(`${'❌'.red} ${message.red}`)
    }

    warn(message: string) {
        console.log(`${'⚠️'.yellow} ${message.yellow}`)
    }

    info(message: string) {
        console.log(`${'ℹ'.blue} ${message}`)
    }

    step(message: string, status: 'pending' | 'done' | 'error' = 'pending') {
        const icon = status === 'done' ? '✅'.green : status === 'error' ? '❌'.red : '⏳'.yellow
        console.log(`   ├── ${icon} ${message}`)
    }

    // ============================================================
    // Tables
    // ============================================================

    table(headers: string[], rows: string[][]) {
        // Calculate column widths
        const widths = headers.map((h, i) => {
            return Math.max(h.length, ...rows.map((r) => (r[i] || '').length))
        })

        // Print header
        const headerLine = headers.map((h, i) => h.padEnd(widths[i])).join(' │ ')
        const dividerLine = widths.map((w) => '─'.repeat(w)).join('─┼─')

        console.log('┌' + widths.map((w) => '─'.repeat(w + 2)).join('┬') + '┐')
        console.log('│ ' + headerLine.bold + ' │')
        console.log('├' + widths.map((w) => '─'.repeat(w + 2)).join('┼') + '┤')

        // Print rows
        for (const row of rows) {
            const rowLine = row.map((cell, i) => (cell || '').padEnd(widths[i])).join(' │ ')
            console.log('│ ' + rowLine + ' │')
        }

        console.log('└' + widths.map((w) => '─'.repeat(w + 2)).join('┴') + '┘')
    }

    // ============================================================
    // Progress
    // ============================================================

    private spinnerFrames = ['⣾', '⣽', '⣻', '⢿', '⡿', '⣟', '⣯', '⣷']
    private spinnerIndex = 0
    private spinnerInterval: NodeJS.Timeout | null = null

    startSpinner(message: string) {
        this.spinnerIndex = 0
        process.stdout.write(`   ${this.spinnerFrames[0].cyan} ${message}`)

        this.spinnerInterval = setInterval(() => {
            this.spinnerIndex = (this.spinnerIndex + 1) % this.spinnerFrames.length
            process.stdout.write(`\r   ${this.spinnerFrames[this.spinnerIndex].cyan} ${message}`)
        }, 80)
    }

    stopSpinner(success = true) {
        if (this.spinnerInterval) {
            clearInterval(this.spinnerInterval)
            this.spinnerInterval = null
        }
        const icon = success ? '✅'.green : '❌'.red
        process.stdout.write(`\r   ${icon}\n`)
    }
}
