import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { SecurityService } from '../src/services/SecurityService.js'
import { withGlobals } from './_helpers/global-state.mjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '..')

// Mock i18n data
const mockLocaleData = {
    errors: {
        server: {
            serverError: { code: 500, msg: 'Server error' },
        },
    },
}

function createMockI18n() {
    return {
        t: (key, params) => {
            const parts = key.split('.')
            let val = mockLocaleData
            for (const p of parts) val = val?.[p]
            if (typeof val === 'object' && val?.msg) return val.msg
            return typeof val === 'string' ? val : key
        },
        error: (key) => {
            const parts = key.split('.')
            let val = mockLocaleData
            for (const p of parts) val = val?.[p]
            return typeof val === 'object' && val?.code ? val : { msg: key, code: 500 }
        },
        get: (key) => {
            const parts = key.split('.')
            let val = mockLocaleData
            for (const p of parts) val = val?.[p]
            return val
        },
    }
}

test('Security.init loads permissions + tx map and sets isReady', async () => {
    await withGlobals(
        ['config', 'i18n', 'log', 'db', 'audit', 'session', 'validator'],
        async () => {
            globalThis.config = {
                app: { lang: 'en' },
                bo: { path: '../../BO/' },
            }
            globalThis.i18n = createMockI18n()

            const logs = []
            globalThis.log = {
                TYPE_ERROR: 'error',
                TYPE_INFO: 'info',
                show: (e) => logs.push(e),
            }

            globalThis.db = {
                query: async (sql) => {
                    // Check for permissions query
                    if (sql.includes('permission_methods')) {
                        return { rows: [{ profile_id: 1, method_na: 'm', object_na: 'o' }] }
                    }
                    // Check for tx/methods query
                    if (sql.includes('security.methods')) {
                        return {
                            rows: [{ tx_nu: 100, object_na: 'Order', method_na: 'createOrder' }],
                        }
                    }
                    return { rows: [] }
                },
            }

            // Mocks for Phase 1 DI
            globalThis.audit = { log: async () => {} }
            globalThis.session = {
                sessionExists: () => false,
                createSession: async () => {},
                destroySession: () => {},
            }
            globalThis.validator = { validate: () => ({ valid: true, data: {} }) }

            const security = new SecurityService(globalThis)
            await security.init()

            assert.equal(security.isReady, true)

            assert.equal(
                security.getPermissions({ profile_id: 1, method_na: 'm', object_na: 'o' }),
                true
            )
            assert.equal(
                security.getPermissions({ profile_id: 2, method_na: 'm', object_na: 'o' }),
                false
            )

            assert.deepEqual(security.getDataTx(100), {
                object_na: 'Order',
                method_na: 'createOrder',
            })
            assert.equal(security.getDataTx(999), false)

            const errors = logs.filter(
                (l) => l?.type === 'error' || l?.type === globalThis.log.TYPE_ERROR
            )
            assert.equal(errors.length, 0)
        }
    )
})

test('Security.init captures initError and rejects ready when DB fails', async () => {
    await withGlobals(
        ['config', 'i18n', 'log', 'db', 'audit', 'session', 'validator'],
        async () => {
            globalThis.config = { app: { lang: 'en' }, bo: { path: '../../BO/' } }
            globalThis.i18n = createMockI18n()

            const logs = []
            globalThis.log = {
                TYPE_ERROR: 'error',
                TYPE_INFO: 'info',
                show: (e) => logs.push(e),
            }

            globalThis.db = {
                query: async (sql) => {
                    if (sql.includes('permission_methods')) throw new Error('db down')
                    if (sql.includes('security.methods')) return { rows: [] }
                    return { rows: [] }
                },
            }

            // Mocks for Phase 1 DI
            globalThis.audit = { log: async () => {} }
            globalThis.session = {
                sessionExists: () => false,
                createSession: async () => {},
                destroySession: () => {},
            }
            globalThis.validator = { validate: () => ({ valid: true, data: {} }) }

            const security = new SecurityService(globalThis)

            let err
            try {
                await security.init()
            } catch (e) {
                err = e
            }

            assert.ok(err)
            assert.equal(security.isReady, false)
            assert.ok(logs.some((l) => String(l?.msg ?? '').includes('SecurityService.init')))
        }
    )
})

test('Security.executeMethod dynamically imports BO and caches the instance', async () => {
    const objectName = `ZzSec${Date.now()}`
    const baseDir = path.join(repoRoot, 'BO', objectName)
    const boFile = path.join(baseDir, `${objectName}BO.ts`)

    await fs.mkdir(baseDir, { recursive: true })

    try {
        await fs.writeFile(
            boFile,
            [
                `globalThis.__securityBoCtorCount ??= 0;`,
                `export class ${objectName}BO {`,
                `  constructor() { globalThis.__securityBoCtorCount++; }`,
                `  async ping(params) { return { code: 200, msg: 'ok', data: params }; }`,
                `}`,
                ``,
            ].join('\n'),
            'utf8'
        )

        await withGlobals(
            ['config', 'i18n', 'log', 'db', 'audit', 'session', 'validator'],
            async () => {
                globalThis.__securityBoCtorCount = 0

                globalThis.config = { app: { lang: 'en' }, bo: { path: '../../BO/' } }
                globalThis.i18n = createMockI18n()
                globalThis.log = { TYPE_ERROR: 'error', TYPE_INFO: 'info', show: () => {} }
                globalThis.db = {
                    query: async (sql) => {
                        if (sql.includes('permission_methods')) return { rows: [] }
                        if (sql.includes('security.methods')) return { rows: [] }
                        return { rows: [] }
                    },
                }

                // Mocks for Phase 1 DI
                globalThis.audit = { log: async () => {} }
                globalThis.session = {
                    sessionExists: () => false,
                    createSession: async () => {},
                    destroySession: () => {},
                }
                globalThis.validator = { validate: () => ({ valid: true, data: {} }) }

                const security = new SecurityService(globalThis)
                await security.init()

                const r1 = await security.executeMethod({
                    object_na: objectName,
                    method_na: 'ping',
                    params: { a: 1 },
                })
                const r2 = await security.executeMethod({
                    object_na: objectName,
                    method_na: 'ping',
                    params: { a: 2 },
                })

                assert.deepEqual(r1, { code: 200, msg: 'ok', data: { a: 1 } })
                assert.deepEqual(r2, { code: 200, msg: 'ok', data: { a: 2 } })

                assert.equal(globalThis.__securityBoCtorCount, 1)
            }
        )
    } finally {
        await fs.rm(baseDir, { recursive: true, force: true })
        delete globalThis.__securityBoCtorCount
    }
})

test('Security.executeMethod returns serverError and logs when BO import fails', async () => {
    await withGlobals(
        ['config', 'i18n', 'log', 'db', 'audit', 'session', 'validator'],
        async () => {
            globalThis.config = { app: { lang: 'en' }, bo: { path: '../../BO/' } }
            globalThis.i18n = createMockI18n()

            const logs = []
            globalThis.log = {
                TYPE_ERROR: 'error',
                TYPE_INFO: 'info',
                show: (e) => logs.push(e),
            }

            globalThis.db = {
                query: async (sql) => {
                    if (sql.includes('permission_methods')) return { rows: [] }
                    if (sql.includes('security.methods')) return { rows: [] }
                    return { rows: [] }
                },
            }

            // Mocks for Phase 1 DI
            globalThis.audit = { log: async () => {} }
            globalThis.session = {
                sessionExists: () => false,
                createSession: async () => {},
                destroySession: () => {},
            }
            globalThis.validator = { validate: () => ({ valid: true, data: {} }) }

            const security = new SecurityService(globalThis)
            await security.init()

            const r = await security.executeMethod({
                object_na: 'DoesNotExist',
                method_na: 'nope',
                params: {},
            })
            assert.deepEqual(r, mockLocaleData.errors.server.serverError)
            assert.ok(
                logs.some((l) => String(l?.msg ?? '').includes('SecurityService.executeMethod'))
            )
        }
    )
})
