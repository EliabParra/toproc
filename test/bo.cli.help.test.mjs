import test from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '..')

test('bo CLI --help muestra ayuda con todos los comandos', () => {
    const r = spawnSync(process.execPath, ['--import', 'tsx', 'scripts/bo/index.ts', '--help'], {
        cwd: repoRoot,
        encoding: 'utf8',
    })

    assert.equal(r.status, 0, `Exit code should be 0, stderr: ${r.stderr}`)
    assert.match(r.stdout, /ToProccess BO CLI/)
    assert.match(r.stdout, /new <name>/)
    assert.match(r.stdout, /list/)
    assert.match(r.stdout, /sync/)
    assert.match(r.stdout, /perms/)
    assert.match(r.stdout, /auth/)
    assert.match(r.stdout, /analyze/)
    assert.match(r.stdout, /init/)
    assert.match(r.stdout, /9 files/)
})

test('bo CLI help no conecta a la DB', () => {
    const r = spawnSync(process.execPath, ['--import', 'tsx', 'scripts/bo/index.ts', '--help'], {
        cwd: repoRoot,
        encoding: 'utf8',
    })

    const combined = `${r.stdout}\n${r.stderr}`
    assert.doesNotMatch(combined, /Error al consultar la base de datos/i)
    assert.doesNotMatch(combined, /ECONNREFUSED/)
    assert.doesNotMatch(combined, /Security\.(init|loadPermissions)/i)
})
