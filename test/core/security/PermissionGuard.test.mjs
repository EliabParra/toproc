import test from 'node:test'
import assert from 'node:assert/strict'
import { PermissionGuard } from '../../../src/core/security/PermissionGuard.js'

test('PermissionGuard Unit Tests', async (t) => {
    await t.test('load() should fetch permissions and populate cache', async () => {
        const mockDb = {
            query: async (sql) => {
                assert.ok(sql.includes('SELECT'), 'Should execute SELECT query')
                return {
                    rows: [
                        { profile_id: 1, object_name: 'Auth', method_name: 'login' },
                        { profile_id: 2, object_name: 'Order', method_name: 'create' },
                    ],
                }
            },
        }
        const mockLog = {
            trace: () => {},
            debug: () => {},
            info: () => {},
            warn: () => {},
            error: () => {},
            critical: () => {},
            child: () => mockLog,
        }

        const guard = new PermissionGuard(mockDb, mockLog)
        await guard.load()

        assert.equal(guard.check(1, 'Auth', 'login'), true)
        assert.equal(guard.check(2, 'Order', 'create'), true)
        assert.equal(guard.check(1, 'Order', 'create'), false)
    })

    await t.test('check() should return false for invalid inputs', async () => {
        const mockLog = {
            trace: () => {},
            debug: () => {},
            info: () => {},
            warn: () => {},
            error: () => {},
            critical: () => {},
            child: () => mockLog,
        }
        const guard = new PermissionGuard({}, mockLog)
        // Pre-load empty to avoid error if load called
        // In this case we test check directly knowing internal set is empty
        assert.equal(guard.check(null, 'Auth', 'login'), false)
        assert.equal(guard.check(1, null, 'login'), false)
        assert.equal(guard.check(1, 'Auth', null), false)
    })

    await t.test('load() handles DB errors', async () => {
        const mockDb = {
            query: async () => {
                throw new Error('DB Connection Failed')
            },
        }
        let loggedError = null
        const mockLog = {
            trace: () => {},
            debug: () => {},
            info: () => {},
            warn: () => {},
            error: (entry) => {
                loggedError = { msg: entry }
            },
            critical: () => {},
            child: () => mockLog,
        }

        const guard = new PermissionGuard(mockDb, mockLog)

        await assert.rejects(async () => await guard.load(), /DB Connection Failed/)
        assert.ok(loggedError.msg.includes('Fallo al cargar permisos'))
    })
})
