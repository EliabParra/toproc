import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

async function scanForValidation(dir: string) {
    const entries = await fs.readdir(dir, { withFileTypes: true })

    for (const e of entries) {
        const fullPath = path.join(dir, e.name)

        if (e.isDirectory()) {
            if (e.name === 'node_modules' || e.name === 'dist' || e.name === '.git') continue
            await scanForValidation(fullPath)
        } else if (e.isFile() && (e.name.endsWith('.ts') || e.name.endsWith('.js'))) {
            const content = await fs.readFile(fullPath, 'utf8')
            const relPath = path.relative(repoRoot, fullPath)

            // Check for g.v.validate usage
            if (content.includes('g.v.validate') || content.includes('this.v.validate')) {
                console.log(`[Validation Legacy] Found usage in: ${relPath}`)
                // In a real script, we could parse AST and suggest replacement
            }
        }
    }
}

console.log('Scanning for legacy validation usage...')
await scanForValidation(path.join(repoRoot, 'src'))
await scanForValidation(path.join(repoRoot, 'BO'))
await scanForValidation(path.join(repoRoot, 'scripts'))
console.log('Scan complete.')
