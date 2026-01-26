import test from 'node:test'
import assert from 'node:assert/strict'

import {
    isPlainObject,
    validateToProccessSchema,
    validateLoginSchema,
    validateLogoutSchema,
    validateLoginVerifySchema,
    parseToProccessBody,
    parseLoginBody,
    parseLoginVerifyBody,
    parseLogoutBody,
} from '../src/helpers/http-validators.js'

// Mock context
function createMockCtx() {
    return {
        v: {
            getMessage: (type, opts) => `${type}:${opts?.label || 'field'}`,
        },
        config: { app: { lang: 'es' } },
        msgs: {
            es: {
                alerts: {
                    paramsType: '{value} debe ser string, number u object',
                },
            },
        },
    }
}

// --- isPlainObject tests ---
test('isPlainObject returns true for plain objects', () => {
    assert.equal(isPlainObject({}), true)
    assert.equal(isPlainObject({ a: 1 }), true)
    assert.equal(isPlainObject({ nested: { obj: true } }), true)
})

test('isPlainObject returns false for non-objects', () => {
    assert.equal(isPlainObject(null), false)
    assert.equal(isPlainObject(undefined), false)
    assert.equal(isPlainObject([]), false)
    assert.equal(isPlainObject([1, 2, 3]), false)
    assert.equal(isPlainObject('string'), false)
    assert.equal(isPlainObject(123), false)
    assert.equal(isPlainObject(true), false)
})

// --- validateToProccessSchema tests ---
test('validateToProccessSchema returns empty for valid body', () => {
    const ctx = createMockCtx()
    const alerts = validateToProccessSchema({ tx: 1, params: {} }, ctx)
    assert.deepEqual(alerts, [])
})

test('validateToProccessSchema returns alert for non-object body', () => {
    const ctx = createMockCtx()
    const alerts = validateToProccessSchema('not an object', ctx)
    assert.ok(alerts.length > 0)
})

test('validateToProccessSchema returns alert for invalid tx', () => {
    const ctx = createMockCtx()
    const alerts = validateToProccessSchema({ tx: 'not-int', params: {} }, ctx)
    assert.ok(alerts.some((a) => a.includes('tx')))
})

test('validateToProccessSchema returns alert for tx <= 0', () => {
    const ctx = createMockCtx()
    assert.ok(validateToProccessSchema({ tx: 0 }, ctx).length > 0)
    assert.ok(validateToProccessSchema({ tx: -1 }, ctx).length > 0)
})

test('validateToProccessSchema allows valid params types', () => {
    const ctx = createMockCtx()
    assert.deepEqual(validateToProccessSchema({ tx: 1, params: 'string' }, ctx), [])
    assert.deepEqual(validateToProccessSchema({ tx: 1, params: 123 }, ctx), [])
    assert.deepEqual(validateToProccessSchema({ tx: 1, params: { key: 'val' } }, ctx), [])
    assert.deepEqual(validateToProccessSchema({ tx: 1, params: null }, ctx), [])
    assert.deepEqual(validateToProccessSchema({ tx: 1, params: undefined }, ctx), [])
})

test('validateToProccessSchema rejects invalid params types', () => {
    const ctx = createMockCtx()
    const alerts = validateToProccessSchema({ tx: 1, params: [1, 2, 3] }, ctx)
    assert.ok(alerts.length > 0)
})

// --- validateLoginSchema tests ---
test('validateLoginSchema returns empty for valid login', () => {
    const ctx = createMockCtx()
    const alerts = validateLoginSchema({ identifier: 'user@test.com', password: '12345678' }, ctx)
    assert.deepEqual(alerts, [])
})

test('validateLoginSchema accepts email as identifier', () => {
    const ctx = createMockCtx()
    const alerts = validateLoginSchema({ email: 'user@test.com', password: '12345678' }, ctx)
    assert.deepEqual(alerts, [])
})

test('validateLoginSchema accepts username as identifier', () => {
    const ctx = createMockCtx()
    const alerts = validateLoginSchema({ username: 'admin', password: '12345678' }, ctx)
    assert.deepEqual(alerts, [])
})

test('validateLoginSchema returns alert for missing identifier', () => {
    const ctx = createMockCtx()
    const alerts = validateLoginSchema({ password: '12345678' }, ctx)
    assert.ok(alerts.some((a) => a.includes('identifier')))
})

test('validateLoginSchema returns alert for non-string password', () => {
    const ctx = createMockCtx()
    const alerts = validateLoginSchema({ identifier: 'user', password: 12345 }, ctx)
    assert.ok(alerts.some((a) => a.includes('password')))
})

test('validateLoginSchema returns alert for short password with minPasswordLen', () => {
    const ctx = createMockCtx()
    const alerts = validateLoginSchema({ identifier: 'user', password: '1234' }, ctx, {
        minPasswordLen: 8,
    })
    assert.ok(alerts.some((a) => a.includes('password')))
})

test('validateLoginSchema returns alert for non-object body', () => {
    const ctx = createMockCtx()
    const alerts = validateLoginSchema('not an object', ctx)
    assert.ok(alerts.length > 0)
})

// --- validateLogoutSchema tests ---
test('validateLogoutSchema returns empty for null body', () => {
    const ctx = createMockCtx()
    assert.deepEqual(validateLogoutSchema(null, ctx), [])
})

test('validateLogoutSchema returns empty for undefined body', () => {
    const ctx = createMockCtx()
    assert.deepEqual(validateLogoutSchema(undefined, ctx), [])
})

test('validateLogoutSchema returns empty for plain object', () => {
    const ctx = createMockCtx()
    assert.deepEqual(validateLogoutSchema({}, ctx), [])
})

test('validateLogoutSchema returns alert for non-object', () => {
    const ctx = createMockCtx()
    const alerts = validateLogoutSchema('string', ctx)
    assert.ok(alerts.length > 0)
})

// --- validateLoginVerifySchema tests ---
test('validateLoginVerifySchema returns empty for valid body', () => {
    const ctx = createMockCtx()
    const alerts = validateLoginVerifySchema({ token: 'abc123', code: '123456' }, ctx)
    assert.deepEqual(alerts, [])
})

test('validateLoginVerifySchema returns alert for missing token', () => {
    const ctx = createMockCtx()
    const alerts = validateLoginVerifySchema({ code: '123456' }, ctx)
    assert.ok(alerts.some((a) => a.includes('token')))
})

test('validateLoginVerifySchema returns alert for missing code', () => {
    const ctx = createMockCtx()
    const alerts = validateLoginVerifySchema({ token: 'abc123' }, ctx)
    assert.ok(alerts.some((a) => a.includes('code')))
})

test('validateLoginVerifySchema returns alert for non-object body', () => {
    const ctx = createMockCtx()
    const alerts = validateLoginVerifySchema(null, ctx)
    assert.ok(alerts.length > 0)
})

// --- parseToProccessBody tests ---
test('parseToProccessBody returns ok=true for valid body', () => {
    const ctx = createMockCtx()
    const result = parseToProccessBody({ tx: 42, params: { key: 'val' } }, ctx)
    assert.equal(result.ok, true)
    if (result.ok) {
        assert.equal(result.body.tx, 42)
        assert.deepEqual(result.body.params, { key: 'val' })
    }
})

test('parseToProccessBody returns ok=false for invalid body', () => {
    const ctx = createMockCtx()
    const result = parseToProccessBody({ tx: 'invalid' }, ctx)
    assert.equal(result.ok, false)
    if (!result.ok) {
        assert.ok(result.alerts.length > 0)
    }
})

// --- parseLoginBody tests ---
test('parseLoginBody returns ok=true for valid login', () => {
    const ctx = createMockCtx()
    const result = parseLoginBody({ identifier: 'user@test.com', password: 'secret123' }, ctx)
    assert.equal(result.ok, true)
    if (result.ok) {
        assert.equal(result.body.identifier, 'user@test.com')
        assert.equal(result.body.password, 'secret123')
    }
})

test('parseLoginBody normalizes email to identifier', () => {
    const ctx = createMockCtx()
    const result = parseLoginBody({ email: 'test@email.com', password: 'secret123' }, ctx)
    assert.equal(result.ok, true)
    if (result.ok) {
        assert.equal(result.body.identifier, 'test@email.com')
    }
})

test('parseLoginBody normalizes username to identifier', () => {
    const ctx = createMockCtx()
    const result = parseLoginBody({ username: 'admin', password: 'secret123' }, ctx)
    assert.equal(result.ok, true)
    if (result.ok) {
        assert.equal(result.body.identifier, 'admin')
    }
})

test('parseLoginBody returns ok=false for invalid login', () => {
    const ctx = createMockCtx()
    const result = parseLoginBody({}, ctx)
    assert.equal(result.ok, false)
})

// --- parseLoginVerifyBody tests ---
test('parseLoginVerifyBody returns ok=true for valid body', () => {
    const ctx = createMockCtx()
    const result = parseLoginVerifyBody({ token: 'tok123', code: '999' }, ctx)
    assert.equal(result.ok, true)
    if (result.ok) {
        assert.equal(result.body.token, 'tok123')
        assert.equal(result.body.code, '999')
    }
})

test('parseLoginVerifyBody returns ok=false for invalid body', () => {
    const ctx = createMockCtx()
    const result = parseLoginVerifyBody({ token: 123 }, ctx)
    assert.equal(result.ok, false)
})

// --- parseLogoutBody tests ---
test('parseLogoutBody returns ok=true for valid body', () => {
    const ctx = createMockCtx()
    const result = parseLogoutBody({}, ctx)
    assert.equal(result.ok, true)
})

test('parseLogoutBody returns ok=true for null body', () => {
    const ctx = createMockCtx()
    const result = parseLogoutBody(null, ctx)
    assert.equal(result.ok, true)
})

test('parseLogoutBody returns ok=false for invalid body', () => {
    const ctx = createMockCtx()
    const result = parseLogoutBody([1, 2, 3], ctx)
    assert.equal(result.ok, false)
})
