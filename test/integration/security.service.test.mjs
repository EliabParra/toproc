import { describe, it, before, after } from 'node:test'
import assert from 'node:assert'
import { container } from '../../src/core/Container.js'
import { SecurityService } from '../../src/security/SecurityService.js'

// Mock dependencies
const mockDb = {
    exe: async (schema, query, params) => {
        if (query === 'loadPermissions')
            return { rows: [{ profile_id: 1, method_na: 'testMethod', object_na: 'TestObject' }] }
        if (query === 'loadDataTx')
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
const mockMsgs = {
    en: { errors: { server: { serverError: { msg: 'Error' } } } },
}

describe('SecurityService Integration', async () => {
    let security

    before(async () => {
        security = new SecurityService({
            db: mockDb,
            log: mockLog,
            config: mockConfig,
            msgs: mockMsgs,
        })
        await security.ready
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
