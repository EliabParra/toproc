import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '..')

// Dynamically import analyze command
async function getAnalyzeCommand() {
    const { AnalyzeCommand } = await import('../scripts/bo/commands/analyze.ts')
    return AnalyzeCommand
}

async function getContext() {
    const { Context } = await import('../scripts/bo/core/ctx.ts')
    return new Context({
        rootDir: path.join(__dirname, 'mocks'),
        isInteractive: false,
        isDryRun: true,
    })
}

test('AnalyzeCommand analiza estructura de BO', async () => {
    // This test just validates the module loads and can be instantiated
    const AnalyzeCommand = await getAnalyzeCommand()
    const ctx = await getContext()

    const cmd = new AnalyzeCommand(ctx)
    assert.ok(cmd, 'AnalyzeCommand should be instantiable')
})

test('Analyze detecta archivos esperados con nomenclatura NameType.ts', async () => {
    // Verify the expected files array uses new naming convention
    const analyzeCode = await fs.readFile(
        path.join(repoRoot, 'scripts/bo/commands/analyze.ts'),
        'utf-8'
    )

    // New naming convention
    assert.match(analyzeCode, /{Name}BO\.ts/)
    assert.match(analyzeCode, /{Name}Service\.ts/)
    assert.match(analyzeCode, /{Name}Repository\.ts/)
    assert.match(analyzeCode, /{Name}Queries\.ts/)
    assert.match(analyzeCode, /{Name}Schemas\.ts/)
    assert.match(analyzeCode, /{Name}Types\.ts/)
    assert.match(analyzeCode, /{Name}Messages\.ts/)
    assert.match(analyzeCode, /{Name}Errors\.ts/)
    assert.match(analyzeCode, /{Name}Module\.ts/)
})
