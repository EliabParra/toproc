import test from 'node:test'
import assert from 'node:assert/strict'
import { z } from 'zod'

import { BaseBO } from '../src/core/business-objects/BaseBO.js'
import { ValidatorService } from '../src/services/ValidatorService.js'

// Create concrete test implementation
class TestBO extends BaseBO {
    async testMethod(params) {
        const schema = z.object({ name: z.string(), value: z.number() })
        const vRes = this.validate(params, schema)
        if (!vRes.ok) return this.validationError(vRes.alerts)
        return this.success(vRes.data, 'Success message')
    }

    async testCreate(params) {
        const schema = z.object({ title: z.string() })
        const vRes = this.validate(params, schema)
        if (!vRes.ok) return this.validationError(vRes.alerts)
        return this.created({ id: 1, ...vRes.data }, 'Created!')
    }

    async testError() {
        return this.error('Something went wrong')
    }
}

function createTestBO() {
    const i18nStub = {
        translate: (k) => k,
        error: (k) => ({ msg: k, code: 500 }),
        get: (k) => undefined,
    }
    const dbStub = { exe: async () => ({ rows: [] }) }
    const logStub = {
        TYPE_INFO: 'info',
        TYPE_WARNING: 'warn',
        TYPE_ERROR: 'error',
        info: () => {},
        error: () => {},
        warn: () => {},
    }
    const configStub = { app: { lang: 'en' } }

    const validator = new ValidatorService(i18nStub)

    return new TestBO({
        db: dbStub,
        log: logStub,
        config: configStub,
        i18n: i18nStub,
        validator: validator,
    })
}

test('BaseBO.validate returns ok=true for valid data', async () => {
    const bo = createTestBO()
    const result = await bo.testMethod({ name: 'Test', value: 42 })

    assert.equal(result.code, 200)
    assert.deepEqual(result.data, { name: 'Test', value: 42 })
})

test('BaseBO.validate returns ok=false with alerts for invalid data', async () => {
    const bo = createTestBO()
    const result = await bo.testMethod({ name: 123, value: 'not a number' })

    assert.equal(result.code, 400)
    assert.ok(Array.isArray(result.alerts))
    assert.ok(result.alerts.length > 0)
})

test('BaseBO.success returns code 200', async () => {
    const bo = createTestBO()
    const result = await bo.testMethod({ name: 'Valid', value: 1 })

    assert.equal(result.code, 200)
    assert.ok(result.msg)
})

test('BaseBO.created returns code 201', async () => {
    const bo = createTestBO()
    const result = await bo.testCreate({ title: 'New Item' })

    assert.equal(result.code, 201)
    assert.equal(result.data.id, 1)
    assert.equal(result.data.title, 'New Item')
})

test('BaseBO.error returns code 500', async () => {
    const bo = createTestBO()
    const result = await bo.testError()

    assert.equal(result.code, 500)
    assert.ok(result.msg)
})

test('BaseBO.validationError returns code 400', async () => {
    const bo = createTestBO()
    const result = await bo.testMethod({}) // Missing required fields

    assert.equal(result.code, 400)
})

test('BaseBO exposes db, log, config dependencies', () => {
    const bo = createTestBO()

    assert.ok(bo.db)
    assert.ok(bo.log)
    assert.ok(bo.config)
})
