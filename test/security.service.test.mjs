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
        translate: (key, params) => {
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
        get messages() {
            return mockLocaleData
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
                info: (e) => logs.push(e),
                error: (e) => logs.push(e),
                warn: (e) => logs.push(e),
                trace: () => {},
                debug: () => {},
                critical: () => {},
                child: () => ({
                    info: (e) => logs.push(e),
                    error: (e) => logs.push(e),
                    warn: (e) => logs.push(e),
                    debug: () => {},
                    trace: () => {},
                    critical: () => {},
                }),
            }

            globalThis.db = {
                query: async (sql) => {
                    // Check for permissions query
                    if (sql.includes('permission_methods')) {
                        return { rows: [{ profile_id: 1, method_name: 'm', object_name: 'o' }] }
                    }
                    // Check for tx/methods query
                    if (sql.includes('security.methods')) {
                        return {
                            rows: [
                                {
                                    tx_nu: 100,
                                    object_name: 'Order',
                                    method_name: 'createOrder',
                                    tx: 100,
                                },
                            ],
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
                security.getPermissions({ profileId: 1, methodName: 'm', objectName: 'o' }),
                true
            )
            assert.equal(
                security.getPermissions({ profileId: 2, methodName: 'm', objectName: 'o' }),
                false
            )

            assert.deepEqual(security.getDataTx(100), {
                objectName: 'Order',
                methodName: 'createOrder',
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
                trace: () => {},
                debug: () => {},
                info: (msg) => logs.push({ msg }),
                warn: (msg) => logs.push({ msg }),
                error: (msg) => logs.push({ msg }),
                critical: () => {},
                child: () => ({
                    trace: () => {},
                    debug: () => {},
                    info: (msg) => logs.push({ msg }),
                    warn: (msg) => logs.push({ msg }),
                    error: (msg) => logs.push({ msg }),
                    critical: () => {},
                }),
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
                `  constructor() { globalThis.__securityBoCtorCount++; this.bound = true; }`,
                `  async ping(params) { if (!this.bound) throw new Error('Context lost'); return { code: 200, msg: 'ok', data: params }; }`,
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
                globalThis.log = {
                    trace: () => {},
                    debug: () => {},
                    info: () => {},
                    warn: () => {},
                    error: () => {},
                    critical: () => {},
                    child: () => ({
                        trace: () => {},
                        debug: () => {},
                        info: () => {},
                        warn: () => {},
                        error: () => {},
                        critical: () => {},
                    }),
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

                const r1 = await security.executeMethod({
                    objectName: objectName,
                    methodName: 'ping',
                    params: { a: 1 },
                })
                const r2 = await security.executeMethod({
                    objectName: objectName,
                    methodName: 'ping',
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
                trace: () => {},
                debug: () => {},
                info: (e) => logs.push(e),
                warn: (e) => logs.push(e),
                error: (e) => logs.push(e),
                critical: () => {},
                child: () => ({
                    trace: () => {},
                    debug: () => {},
                    info: (e) => logs.push(e),
                    warn: (e) => logs.push(e),
                    error: (e) => logs.push(e),
                    critical: () => {},
                }),
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
                objectName: 'DoesNotExist',
                methodName: 'nope',
                params: {},
            })
            assert.deepEqual(r, mockLocaleData.errors.server.serverError)
            assert.ok(
                logs.some((l) =>
                    (typeof l === 'string' ? l : l.msg).includes('SecurityService.executeMethod')
                )
            )
        }
    )
})
