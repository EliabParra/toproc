import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

// Simple regex to find "strings" that might be user-facing messages
// This is very naive, for demonstration purposes
const messageRegex = /['"`]([A-Z][a-z0-9\s\.,!]{5,})['"`]/g

async function scanForMessages(dir: string) {
    const entries = await fs.readdir(dir, { withFileTypes: true })

    for (const e of entries) {
        const fullPath = path.join(dir, e.name)

        if (e.isDirectory()) {
            if (e.name === 'node_modules' || e.name === 'dist' || e.name === '.git') continue
            await scanForMessages(fullPath)
        } else if (e.isFile() && (e.name.endsWith('.ts') || e.name.endsWith('.js'))) {
            const content = await fs.readFile(fullPath, 'utf8')
            const relPath = path.relative(repoRoot, fullPath)

            let match
            while ((match = messageRegex.exec(content)) !== null) {
                // Ignore imports/exports/console
                if (
                    content
                        .substring(Math.max(0, match.index - 20), match.index)
                        .includes('console.')
                )
                    continue
                if (
                    content
                        .substring(Math.max(0, match.index - 20), match.index)
                        .includes('import ')
                )
                    continue

                console.log(`[Message Candidate] "${match[1]}" in ${relPath}`)
            }
        }
    }
}

console.log('Scanning for hardcoded messages...')
await scanForMessages(path.join(repoRoot, 'src'))
await scanForMessages(path.join(repoRoot, 'BO'))
console.log('Scan complete.')
