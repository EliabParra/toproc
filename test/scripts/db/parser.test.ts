import { describe, it } from 'node:test'
import assert from 'node:assert'
import { parseCliArgs, printHelp } from '../../../scripts/db/cli/parser.js'

describe('CLI Parser', () => {
    it('should parse sync action from positional arg', () => {
        const result = parseCliArgs(['sync'])
        assert.strictEqual(result.action, 'sync')
    })

    it('should parse introspect action from flag', () => {
        const result = parseCliArgs(['--introspect'])
        assert.strictEqual(result.action, 'introspect')
    })

    it('should parse pull as alias for introspect', () => {
        const result = parseCliArgs(['pull'])
        assert.strictEqual(result.action, 'introspect')
    })

    it('should parse --yes flag as non-interactive', () => {
        const result = parseCliArgs(['--yes'])
        assert.strictEqual(result.app?.interactive, false)
    })

    it('should parse database host', () => {
        const result = parseCliArgs(['--host', 'myhost.com'])
        assert.strictEqual(result.db?.host, 'myhost.com')
    })

    it('should parse database port', () => {
        const result = parseCliArgs(['--port', '5433'])
        assert.strictEqual(result.db?.port, 5433)
    })

    it('should parse --auth flag', () => {
        const result = parseCliArgs(['--auth'])
        assert.strictEqual(result.auth?.enabled, true)
    })

    it('should parse --authLoginId', () => {
        const result = parseCliArgs(['--authLoginId', 'username'])
        assert.strictEqual(result.auth?.loginId, 'username')
    })

    it('should parse --seedAdmin flag', () => {
        const result = parseCliArgs(['--seedAdmin'])
        assert.strictEqual(result.security?.seedAdmin, true)
    })

    it('should parse --adminUser', () => {
        const result = parseCliArgs(['--adminUser', 'superadmin'])
        assert.strictEqual(result.security?.adminUser, 'superadmin')
    })

    it('should parse --profileId', () => {
        const result = parseCliArgs(['--profileId', '5'])
        assert.strictEqual(result.security?.adminProfileId, 5)
    })

    it('should parse --registerBo flag', () => {
        const result = parseCliArgs(['--registerBo'])
        assert.strictEqual(result.security?.registerBo, true)
    })

    it('should parse --help flag', () => {
        const result = parseCliArgs(['--help'])
        assert.strictEqual(result.help, true)
    })

    it('should parse complex command with multiple flags', () => {
        const result = parseCliArgs([
            'sync',
            '--host',
            'db.example.com',
            '--port',
            '5432',
            '--user',
            'myuser',
            '--password',
            'secret',
            '--database',
            'mydb',
            '--auth',
            '--seedAdmin',
            '--adminUser',
            'root',
            '--registerBo',
            '--yes',
        ])

        assert.strictEqual(result.action, 'sync')
        assert.strictEqual(result.db?.host, 'db.example.com')
        assert.strictEqual(result.db?.port, 5432)
        assert.strictEqual(result.db?.user, 'myuser')
        assert.strictEqual(result.db?.password, 'secret')
        assert.strictEqual(result.db?.database, 'mydb')
        assert.strictEqual(result.auth?.enabled, true)
        assert.strictEqual(result.security?.seedAdmin, true)
        assert.strictEqual(result.security?.adminUser, 'root')
        assert.strictEqual(result.security?.registerBo, true)
        assert.strictEqual(result.app?.interactive, false)
    })
})
