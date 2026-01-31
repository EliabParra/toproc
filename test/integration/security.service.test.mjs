import { describe, it, before, after } from 'node:test'
import assert from 'node:assert'
import { container } from '../../src/core/Container.js'
import { SecurityService } from '../../src/services/SecurityService.js'

// Mock dependencies
const mockDb = {
    query: async (sql, params) => {
        if (sql.includes('permission_methods'))
            return { rows: [{ profile_id: 1, method_na: 'testMethod', object_na: 'TestObject' }] }
        if (sql.includes('security.methods'))
            return { rows: [{ tx_nu: 100, object_na: 'TestObject', method_na: 'testMethod' }] }
        return { rows: [] }
    },
}
const mockLog = {
    TYPE_ERROR: 0,
    show: () => {},
}
const mockConfig = {
    bo: { path: '../../test/mocks/BO/' }, // Point to test BOs
    app: { lang: 'en' },
}
const mockI18n = {
    t: (key) => key,
    error: (key) => ({ msg: key, code: 500 }),
    get: (key) => undefined,
}

describe('SecurityService Integration', async () => {
    let security

    before(async () => {
        security = new SecurityService({
            db: mockDb,
            log: mockLog,
            config: mockConfig,
            i18n: mockI18n,
            audit: { log: async () => {} },
            session: {
                sessionExists: () => false,
                createSession: async () => {},
                destroySession: () => {},
            },
            validator: { validate: () => ({ valid: true, data: {} }) },
        })
        await security.init()
    })

    it('should load permissions and tx maps', () => {
        assert.strictEqual(security.getDataTx(100).method_na, 'testMethod')
        assert.strictEqual(
            security.getPermissions({
                profile_id: 1,
                object_na: 'TestObject',
                method_na: 'testMethod',
            }),
            true
        )
    })

    it('should fail permission check for unknown profile', () => {
        assert.strictEqual(
            security.getPermissions({
                profile_id: 999,
                object_na: 'TestObject',
                method_na: 'testMethod',
            }),
            false
        )
    })
})
