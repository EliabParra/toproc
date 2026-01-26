import test from 'node:test'
import assert from 'node:assert/strict'

import { LegacyValidatorAdapter } from '../src/core/validation/integration/LegacyValidatorAdapter.js'
import { AppValidator } from '../src/core/validation/AppValidator.js'

function createAdapter() {
    const i18nStub = { t: (k) => k }
    const appValidator = new AppValidator(i18nStub)
    return new LegacyValidatorAdapter(appValidator)
}

test('LegacyValidatorAdapter.validate returns true for valid int', () => {
    const adapter = createAdapter()
    assert.equal(adapter.validate(42, 'int'), true)
})

test('LegacyValidatorAdapter.validate returns false for invalid int', () => {
    const adapter = createAdapter()
    assert.equal(adapter.validate('not a number', 'int'), false)
    assert.ok(adapter.getAlerts().length > 0)
})

test('LegacyValidatorAdapter.validate returns true for valid string', () => {
    const adapter = createAdapter()
    assert.equal(adapter.validate('hello', 'string'), true)
})

test('LegacyValidatorAdapter.validate returns false for invalid string', () => {
    const adapter = createAdapter()
    assert.equal(adapter.validate(123, 'string'), false)
})

test('LegacyValidatorAdapter.validate returns true for valid email', () => {
    const adapter = createAdapter()
    assert.equal(adapter.validate('user@example.com', 'email'), true)
})

test('LegacyValidatorAdapter.validate returns false for invalid email', () => {
    const adapter = createAdapter()
    assert.equal(adapter.validate('not-an-email', 'email'), false)
})

test('LegacyValidatorAdapter.validate returns true for notEmpty string', () => {
    const adapter = createAdapter()
    assert.equal(adapter.validate('content', 'notEmpty'), true)
})

test('LegacyValidatorAdapter.validate returns false for empty notEmpty', () => {
    const adapter = createAdapter()
    assert.equal(adapter.validate('', 'notEmpty'), false)
})

test('LegacyValidatorAdapter.validate returns true for boolean', () => {
    const adapter = createAdapter()
    assert.equal(adapter.validate(true, 'boolean'), true)
    assert.equal(adapter.validate(false, 'boolean'), true)
})

test('LegacyValidatorAdapter.validate returns false for non-boolean', () => {
    const adapter = createAdapter()
    assert.equal(adapter.validate('true', 'boolean'), false)
})

test('LegacyValidatorAdapter.validate returns true for array', () => {
    const adapter = createAdapter()
    assert.equal(adapter.validate([1, 2, 3], 'array'), true)
})

test('LegacyValidatorAdapter.validate returns false for non-array', () => {
    const adapter = createAdapter()
    assert.equal(adapter.validate({ a: 1 }, 'array'), false)
})

test('LegacyValidatorAdapter.validate returns true for arrayNotEmpty', () => {
    const adapter = createAdapter()
    assert.equal(adapter.validate([1], 'arrayNotEmpty'), true)
})

test('LegacyValidatorAdapter.validate returns false for empty array', () => {
    const adapter = createAdapter()
    assert.equal(adapter.validate([], 'arrayNotEmpty'), false)
})

test('LegacyValidatorAdapter.validate returns true for object', () => {
    const adapter = createAdapter()
    assert.equal(adapter.validate({ key: 'value' }, 'object'), true)
})

test('LegacyValidatorAdapter.validate returns true for objectNotEmpty', () => {
    const adapter = createAdapter()
    assert.equal(adapter.validate({ key: 'value' }, 'objectNotEmpty'), true)
})

test('LegacyValidatorAdapter.validate returns false for empty object', () => {
    const adapter = createAdapter()
    assert.equal(adapter.validate({}, 'objectNotEmpty'), false)
})

test('LegacyValidatorAdapter.validate returns false for unknown type', () => {
    const adapter = createAdapter()
    assert.equal(adapter.validate('test', 'unknownType'), false)
    assert.ok(adapter.getAlerts().some((a) => a.includes('desconocido')))
})

test('LegacyValidatorAdapter.validateAll returns true for valid params', () => {
    const adapter = createAdapter()
    const result = adapter.validateAll([42, 'hello'], ['int', 'string'])
    assert.equal(result, true)
    assert.deepEqual(adapter.getStatus(), { result: true, alerts: [] })
})

test('LegacyValidatorAdapter.validateAll returns false for invalid params', () => {
    const adapter = createAdapter()
    const result = adapter.validateAll(['not-int', 123], ['int', 'string'])
    assert.equal(result, false)
    assert.ok(adapter.getStatus().alerts.length > 0)
})

test('LegacyValidatorAdapter.validateAll returns false for non-array inputs', () => {
    const adapter = createAdapter()
    const result = adapter.validateAll('invalid', 'also invalid')
    assert.equal(result, false)
})

test('LegacyValidatorAdapter.getMessage returns formatted message', () => {
    const adapter = createAdapter()
    const msg = adapter.getMessage('length', { label: 'password', min: 8 })
    assert.match(msg, /password/)
    assert.match(msg, /8/)
})

test('LegacyValidatorAdapter.validateInt works', () => {
    const adapter = createAdapter()
    assert.equal(adapter.validateInt(5), true)
    assert.equal(adapter.validateInt('five'), false)
})

test('LegacyValidatorAdapter.validateString works', () => {
    const adapter = createAdapter()
    assert.equal(adapter.validateString('test'), true)
    assert.equal(adapter.validateString(123), false)
})

test('LegacyValidatorAdapter.validateEmail works', () => {
    const adapter = createAdapter()
    assert.equal(adapter.validateEmail('a@b.com'), true)
    assert.equal(adapter.validateEmail('invalid'), false)
})
