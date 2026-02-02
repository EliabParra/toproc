import { describe, it, before, after } from 'node:test'
import assert from 'node:assert'
import { container } from '../../src/core/Container.js'
import { SecurityService } from '../../src/services/SecurityService.js'

// Mock dependencies
const mockDb = {
    query: async (sql, params) => {
        if (sql.includes('permission_methods'))
            return {
                rows: [{ profile_id: 1, method_name: 'testMethod', object_name: 'TestObject' }],
            }
        if (sql.includes('security.methods'))
            return {
                rows: [
                    { tx_nu: 100, object_name: 'TestObject', method_name: 'testMethod', tx: 100 },
                ],
            }
        return { rows: [] }
    },
}
const mockLog = {
    info: () => {},
    error: () => {},
    warn: () => {},
    child: () => mockLog,
}
const mockConfig = {
    bo: { path: '../../test/mocks/BO/' }, // Point to test BOs
    app: { lang: 'en' },
}
const mockI18n = {
    translate: (key) => key,
    error: (key) => ({ msg: key, code: 500 }),
    get: (key) => undefined,
    get messages() {
        return {
            errors: {
                server: {
                    serverError: { msg: 'Server Error', code: 500 },
                },
            },
        }
    },
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
        assert.strictEqual(security.getDataTx(100).methodName, 'testMethod')
        assert.strictEqual(
            security.getPermissions({
                profileId: 1,
                objectName: 'TestObject',
                methodName: 'testMethod',
            }),
            true
        )
    })

    it('should fail permission check for unknown profile', () => {
        assert.strictEqual(
            security.getPermissions({
                profileId: 999,
                objectName: 'TestObject',
                methodName: 'testMethod',
            }),
            false
        )
    })
})
