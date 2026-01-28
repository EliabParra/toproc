import fs from 'node:fs'
import path from 'node:path'
import colors from 'colors'

const ROOT = process.cwd()
const SRC = path.join(ROOT, 'src')
const BO = path.join(ROOT, 'BO')

interface Rule {
    id: string
    msg: string
    pattern: RegExp
    severity: 'error' | 'warning'
    include?: RegExp // Only check files matching this
    exclude?: RegExp
}

const RULES: Rule[] = [
    {
        id: 'no-console-log',
        msg: 'Use ILogger (this.log.show) instead of console.log',
        pattern: /console\.log\(/,
        severity: 'warning',
        exclude: /scripts|test|logger/,
    },
    {
        id: 'no-req-body',
        msg: 'Do not access req.body directly in BOs. Use this.validate()',
        pattern: /req\.body/,
        severity: 'error',
        include: /BO\/.*BO\.ts$/,
    },
    {
        id: 'no-throw-string',
        msg: 'Do not throw strings. Throw Error or subclasses.',
        pattern: /throw\s+['"`]/,
        severity: 'error',
    },
    {
        id: 'no-relative-import-to-root',
        msg: 'Avoid deep relative imports to index. Use absolute or structured imports.',
        pattern: /\.\.\/\.\.\/src\/index/,
        severity: 'warning',
    },
]

let errorCount = 0
let warningCount = 0

function scanDir(dir: string) {
    const files = fs.readdirSync(dir)

    for (const file of files) {
        const fullPath = path.join(dir, file)
        const stat = fs.statSync(fullPath)

        if (stat.isDirectory()) {
            if (file === 'node_modules' || file === 'dist' || file === '.git') continue
            scanDir(fullPath)
        } else if (file.endsWith('.ts')) {
            checkFile(fullPath)
        }
    }
}

function checkFile(filePath: string) {
    const content = fs.readFileSync(filePath, 'utf-8')
    const lines = content.split('\n')
    const relativePath = path.relative(ROOT, filePath)

    // Normalize path separators for regex checks
    const normalizedPath = relativePath.replace(/\\/g, '/')

    for (const rule of RULES) {
        if (rule.include && !rule.include.test(normalizedPath)) continue
        if (rule.exclude && rule.exclude.test(normalizedPath)) continue

        lines.forEach((line, idx) => {
            if (rule.pattern.test(line)) {
                // Ignore comments
                if (line.trim().startsWith('//') || line.trim().startsWith('*')) return

                const loc = `${relativePath}:${idx + 1}`
                const message = `[${rule.severity.toUpperCase()}] ${rule.msg}`

                if (rule.severity === 'error') {
                    console.log(`${colors.red(loc)} - ${message}`)
                    console.log(`   ${colors.gray(line.trim())}`)
                    errorCount++
                } else {
                    console.log(`${colors.yellow(loc)} - ${message}`)
                    console.log(`   ${colors.gray(line.trim())}`)
                    warningCount++
                }
            }
        })
    }
}

console.log('🔍 Starting Code Audit...')
console.log('Checking ARCHITECTURE rules...\n')

if (fs.existsSync(SRC)) scanDir(SRC)
if (fs.existsSync(BO)) scanDir(BO)

console.log('\n--- Audit Summary ---')
console.log(`Errors: ${errorCount}`)
console.log(`Warnings: ${warningCount}`)

if (errorCount > 0) process.exit(1)
