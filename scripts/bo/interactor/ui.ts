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
        let index = defaultOption ? Math.max(0, options.indexOf(defaultOption)) : 0

        // Hide cursor
        process.stdout.write('\x1B[?25l')

        const print = () => {
            // Move cursor to start
            process.stdout.write('\r')
            // Clear screen down (if we want robust redraw, simpler is just rewriting lines if we know count)
            // But for simplicity, we'll clear N lines up.
            // Better: use a fresh "render" approach.
            // Since we can't easily clear "previous" render without tracking lines, let's assume we print once and then use ansi moves.
            // Actually, for a robust CLI without deps, standard practice is:
            // Print Question
            // Print Options
            // Move cursor back up N lines.

            // For now, let's just print the menu.
            console.log(`${'➜'.green} ${question.bold}:`)
            options.forEach((opt, i) => {
                const marker = i === index ? '❯'.cyan : ' '
                const style = i === index ? (s: string) => s.cyan.bold : (s: string) => s
                console.log(`  ${marker} ${style(opt)}`)
            })
        }

        // Initial render
        // We will assume "fullscreen" component style for list isn't feasible cleanly without clearing.
        // Let's use a "redraw" strategy: Move cursor up N lines, Clear, Print.

        const render = () => {
            options.forEach((opt, i) => {
                const marker = i === index ? '❯'.cyan : ' '
                const style = i === index ? (s: string) => s.cyan.bold : (s: string) => s
                // Clear line
                process.stdout.write('\x1B[2K\r')
                console.log(`  ${marker} ${style(opt)}`)
            })
        }

        console.log(`${'➜'.green} ${question.bold}:`)
        // Reserve space
        for (let i = 0; i < options.length; i++) console.log('')
        // Move back up
        process.stdout.write(`\x1B[${options.length}A`)

        render()

        return new Promise((resolve) => {
            const onData = (key: Buffer) => {
                // Up
                if (key.toString() === '\u001b[A') {
                    index = (index - 1 + options.length) % options.length
                    process.stdout.write(`\x1B[${options.length}A`)
                    render()
                }
                // Down
                if (key.toString() === '\u001b[B') {
                    index = (index + 1) % options.length
                    process.stdout.write(`\x1B[${options.length}A`)
                    render()
                }
                // Enter
                if (key.toString() === '\r' || key.toString() === '\n') {
                    cleanup()
                    process.stdout.write('\x1B[?25h') // Show cursor
                    // Move cursor down to end
                    // process.stdout.write(`\x1B[${options.length}B`) // Actually we are at bottom? No we are at bottom of render loop.
                    resolve(options[index])
                }
                // Ctrl+C
                if (key.toString() === '\u0003') {
                    cleanup()
                    process.stdout.write('\x1B[?25h')
                    process.exit(0)
                }
            }

            const cleanup = () => {
                process.stdin.removeListener('data', onData)
                process.stdin.setRawMode(false)
                process.stdin.pause()
            }

            process.stdin.setRawMode(true)
            process.stdin.resume()
            process.stdin.on('data', onData)
        })
    }

    async multiSelect(
        question: string,
        options: string[],
        defaults: string[] = []
    ): Promise<string[]> {
        const selected = new Set<string>(defaults)
        let index = 0

        process.stdout.write('\x1B[?25l') // Hide cursor

        console.log(`${'➜ '.green} ${question.bold}:`)
        console.log('   Use arrows to move, Space to toggle, Enter to confirm'.gray)

        // Reserve space
        for (let i = 0; i < options.length; i++) console.log('')
        process.stdout.write(`\x1B[${options.length}A`)

        const render = () => {
            options.forEach((opt, i) => {
                const isSelected = selected.has(opt)
                const isFocused = i === index

                const checkbox = isSelected ? '◉'.green : '◯'.gray
                const cursor = isFocused ? '❯'.cyan : ' '
                const label = isFocused ? opt.cyan.bold : opt.gray

                process.stdout.write('\x1B[2K\r') // Clear line
                console.log(`  ${cursor} ${checkbox} ${label}`)
            })
        }

        render()

        return new Promise((resolve) => {
            const onData = (key: Buffer) => {
                const k = key.toString()

                // Up
                if (k === '\u001b[A') {
                    index = (index - 1 + options.length) % options.length
                    process.stdout.write(`\x1B[${options.length}A`)
                    render()
                }
                // Down
                if (k === '\u001b[B') {
                    index = (index + 1) % options.length
                    process.stdout.write(`\x1B[${options.length}A`)
                    render()
                }
                // Space (Toggle)
                if (k === ' ') {
                    const opt = options[index]
                    if (selected.has(opt)) selected.delete(opt)
                    else selected.add(opt)
                    process.stdout.write(`\x1B[${options.length}A`)
                    render()
                }
                // Enter
                if (k === '\r' || k === '\n') {
                    cleanup()
                    process.stdout.write('\x1B[?25h')
                    resolve(Array.from(selected))
                }
                // Ctrl+C
                if (k === '\u0003') {
                    cleanup()
                    process.stdout.write('\x1B[?25h')
                    process.exit(0)
                }
            }

            const cleanup = () => {
                process.stdin.removeListener('data', onData)
                process.stdin.setRawMode(false)
                process.stdin.pause()
            }

            process.stdin.setRawMode(true)
            process.stdin.resume()
            process.stdin.on('data', onData)
        })
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

    private visibleLength(str: string): number {
        // Remove ANSI codes
        const noAnsi = str.replace(
            /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g,
            ''
        )
        // Remove Variation Selector-16 (\uFE0F) which adds length but is visually merged
        const noVS16 = noAnsi.replace(/\uFE0F/g, '')
        return noVS16.length
    }

    table(headers: string[], rows: string[][]) {
        // Calculate column widths
        const widths = headers.map((h, i) => {
            return Math.max(
                this.visibleLength(h),
                ...rows.map((r) => this.visibleLength(r[i] || ''))
            )
        })

        const pad = (s: string, w: number) => {
            const len = this.visibleLength(s)
            return s + ' '.repeat(Math.max(0, w - len))
        }

        // Print header
        const headerLine = headers.map((h, i) => pad(h, widths[i])).join(' │ ')
        const dividerLine = widths.map((w) => '─'.repeat(w)).join('─┼─')

        console.log('┌' + widths.map((w) => '─'.repeat(w + 2)).join('┬') + '┐')
        console.log('│ ' + headerLine.bold + ' │')
        console.log('├' + widths.map((w) => '─'.repeat(w + 2)).join('┼') + '┤')

        // Print rows
        for (const row of rows) {
            const rowLine = row.map((cell, i) => pad(cell || '', widths[i])).join(' │ ')
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
        const icon = success ? '✅ '.green : '❌ '.red
        process.stdout.write(`\r   ${icon}\n`)
    }
}
