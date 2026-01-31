import { describe, it } from 'node:test'
import assert from 'node:assert'
import { BORegistrar } from '../../../scripts/db/seeders/bo-registrar.js'

// Simple mock that tracks queries
function createMockDB(initialMethods: any[] = []) {
    const state = {
        queries: [] as Array<{ query: string; params: any[] }>,
        nextTx: 100,
        dbMethods: [...initialMethods],
    }

    return {
        ...state,
        async exeRaw(query: string, params: any[] = []) {
            state.queries.push({ query, params })

            if (query.includes('MAX(tx)')) {
                return { rows: [{ next_tx: state.nextTx }] }
            }
            if (query.includes('security.profiles')) {
                return { rows: [{}], rowCount: 1 }
            }
            if (query.includes('security.objects') && query.includes('INSERT')) {
                return { rows: [{ object_id: 42 }] }
            }
            if (query.includes('INSERT INTO security.methods')) {
                return { rows: [{ method_id: 1, tx: state.nextTx }] }
            }
            if (query.includes('FROM security.methods m')) {
                return { rows: state.dbMethods }
            }
            if (query.includes('DELETE')) {
                return { rowCount: 1 }
            }
            return { rows: [] }
        },
        getQueries() {
            return state.queries
        },
    }
}

describe('BORegistrar syncMethods', () => {
    it('should return empty result when no BOs found (dryRun)', async () => {
        const mockDb = createMockDB()
        const registrar = new BORegistrar(mockDb as any, './non-existent-folder')

        const result = await registrar.syncMethods({
            profileId: 1,
            dryRun: true,
        })

        assert.strictEqual(result.added, 0)
        assert.strictEqual(result.pruned, 0)
        assert.strictEqual(result.orphaned.length, 0)
    })

    it('should detect orphaned methods in DB', async () => {
        const mockDb = createMockDB([
            { method_id: 1, object_name: 'TestBO', method_name: 'oldMethod', tx: 10 },
        ])
        const registrar = new BORegistrar(mockDb as any, './non-existent-folder')

        const result = await registrar.syncMethods({
            profileId: 1,
            dryRun: true,
        })

        assert.strictEqual(result.orphaned.length, 1)
        assert.strictEqual(result.orphaned[0].methodName, 'oldMethod')
    })

    it('should not delete when prune=false', async () => {
        const mockDb = createMockDB([
            { method_id: 1, object_name: 'TestBO', method_name: 'oldMethod', tx: 10 },
        ])
        const registrar = new BORegistrar(mockDb as any, './non-existent-folder')

        const result = await registrar.syncMethods({
            profileId: 1,
            prune: false,
        })

        const deleteQueries = mockDb.getQueries().filter((q) => q.query.includes('DELETE'))
        assert.strictEqual(deleteQueries.length, 0)
        assert.strictEqual(result.pruned, 0)
    })

    it('should delete orphans when prune=true', async () => {
        const mockDb = createMockDB([
            { method_id: 1, object_name: 'TestBO', method_name: 'oldMethod', tx: 10 },
        ])
        const registrar = new BORegistrar(mockDb as any, './non-existent-folder')

        const result = await registrar.syncMethods({
            profileId: 1,
            prune: true,
        })

        const deleteQueries = mockDb.getQueries().filter((q) => q.query.includes('DELETE'))
        // Expect 2 DELETEs (permission_methods + methods)
        assert.ok(
            deleteQueries.length >= 2,
            `Expected at least 2 DELETE queries, got ${deleteQueries.length}`
        )
        assert.strictEqual(result.pruned, 1)
    })

    it('should not delete when dryRun=true even if prune=true', async () => {
        const mockDb = createMockDB([
            { method_id: 1, object_name: 'TestBO', method_name: 'oldMethod', tx: 10 },
        ])
        const registrar = new BORegistrar(mockDb as any, './non-existent-folder')

        const result = await registrar.syncMethods({
            profileId: 1,
            prune: true,
            dryRun: true,
        })

        const deleteQueries = mockDb.getQueries().filter((q) => q.query.includes('DELETE'))
        assert.strictEqual(deleteQueries.length, 0)
        assert.strictEqual(result.pruned, 0)
        assert.strictEqual(result.orphaned.length, 1)
    })
})
