import test from 'node:test'
import assert from 'node:assert/strict'
import { BaseBO } from '../../src/core/business-objects/BaseBO.js'

// Mock dependencies
const mockDeps = {
    db: {},
    log: { info: () => {}, error: () => {} },
    config: {},
    validator: { validate: (d) => ({ valid: true, data: d }) },
    i18n: {
        translate: (key) => {
            if (key === 'success.create') return 'Elemento creado con éxito'
            return key
        },
    },
}

class TestBO extends BaseBO {
    constructor() {
        super(mockDeps)
    }

    testSuccess(data, msg) {
        return this.success(data, msg)
    }
    testCreated(data, msg) {
        return this.created(data, msg)
    }
}

test('BaseBO translates success message', () => {
    const bo = new TestBO()
    const res = bo.testSuccess({ id: 1 }, 'success.create')

    assert.equal(res.code, 200)
    assert.equal(res.msg, 'Elemento creado con éxito')
})

test('BaseBO translates created message', () => {
    const bo = new TestBO()
    const res = bo.testCreated({ id: 1 }, 'success.create')

    assert.equal(res.code, 201)
    assert.equal(res.msg, 'Elemento creado con éxito')
})

test('BaseBO uses default message if not provided', () => {
    const bo = new TestBO()
    // Using default parameter
    const res = bo.testSuccess({ id: 1 })
    // Mock translate returns key if not found, 'OK' is the default key passed
    assert.equal(res.code, 200)
    assert.equal(res.msg, 'OK')
})
