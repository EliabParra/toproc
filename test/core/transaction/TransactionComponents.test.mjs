import test, { describe, it, before, after, mock } from 'node:test'
import assert from 'node:assert/strict'
import path from 'node:path'
import { TransactionMapper } from '../../../src/core/transaction/TransactionMapper.js'
import { TransactionExecutor } from '../../../src/core/transaction/TransactionExecutor.js'

describe('Transaction Core Components', () => {
    describe('TransactionMapper', () => {
        it('load() populates map from DB', async () => {
            const mockDb = {
                query: async () => ({
                    rows: [
                        { tx: 100, object_name: 'Auth', method_name: 'login' },
                        { tx: '200', object_name: 'Order', method_name: 'create' },
                    ],
                }),
            }
            const logs = []
            const mockLog = {
                trace: () => {},
                debug: () => {},
                info: (l) => logs.push({ ...l, msg: l }), // Adapt msg to string
                warn: () => {},
                error: () => {},
                critical: () => {},
                child: () => mockLog,
            }

            const mapper = new TransactionMapper(mockDb, mockLog)
            await mapper.load()

            assert.deepEqual(mapper.resolve(100), { objectName: 'Auth', methodName: 'login' })
            assert.deepEqual(mapper.resolve(200), { objectName: 'Order', methodName: 'create' })
            assert.equal(mapper.resolve(999), null)
            assert.ok(logs.some((l) => l.msg.includes('Carga exitosa')))
        })
    })

    describe('TransactionExecutor', () => {
        const mockLog = {
            trace: () => {},
            debug: () => {},
            info: () => {},
            warn: () => {},
            error: () => {},
            critical: () => {},
            child: () => mockLog,
        }
        const mockConfig = { bo: { path: 'BO/' } }
        // Base Path simulation
        const cwd = process.cwd()

        it('execute() throws security error for Path Traversal', async () => {
            const executor = new TransactionExecutor({ config: mockConfig, log: mockLog })

            await assert.rejects(
                async () => await executor.execute('../../Secrets', 'steal', {}),
                /Access Denied/
            )
        })

        it('execute() throws security error if path resolves outside BO root', async () => {
            const executor = new TransactionExecutor({ config: mockConfig, log: mockLog })

            // Even if valid file syntax, if it goes up
            await assert.rejects(
                async () => await executor.execute('..', 'test', {}),
                /Access Denied/
            )
        })
    })
})
