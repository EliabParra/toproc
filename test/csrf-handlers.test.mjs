import test from 'node:test'
import assert from 'node:assert/strict'

import {
    ensureCsrfToken,
    createCsrfTokenHandler,
    createCsrfProtection,
} from '../src/api/http/middleware/csrf.js'

// Mock i18n helper
function createMockI18n(overrides = {}) {
    const data = {
        errors: {
            client: {
                unknown: { code: 500, msg: 'Unknown' },
                csrfInvalid: { code: 403, msg: 'Invalid CSRF' },
                ...overrides.client,
            },
        },
    }
    return {
        translate: (key) => key,
        error: (key) => {
            const parts = key.split('.')
            let val = data
            for (const p of parts) val = val?.[p]
            return val || { msg: key, code: 500 }
        },
        get: (key) => {
            const parts = key.split('.')
            let val = data
            for (const p of parts) val = val?.[p]
            return val
        },
        get messages() {
            return data
        },
    }
}

// --- ensureCsrfToken tests ---
test('ensureCsrfToken returns null if no session', () => {
    const req = {}
    const result = ensureCsrfToken(req)
    assert.equal(result, null)
})

test('ensureCsrfToken returns existing token if present', () => {
    const req = { session: { csrfToken: 'existing-token-123' } }
    const result = ensureCsrfToken(req)
    assert.equal(result, 'existing-token-123')
})

test('ensureCsrfToken generates new token if not present', () => {
    const req = { session: {} }
    const result = ensureCsrfToken(req)

    assert.ok(typeof result === 'string')
    assert.equal(result.length, 64) // 32 bytes = 64 hex chars
    assert.equal(req.session.csrfToken, result)
})

test('ensureCsrfToken generates new token if empty string', () => {
    const req = { session: { csrfToken: '' } }
    const result = ensureCsrfToken(req)

    assert.ok(result.length > 0)
    assert.equal(req.session.csrfToken, result)
})

// --- createCsrfTokenHandler tests ---
test('createCsrfTokenHandler returns 200 with token', () => {
    const i18n = createMockI18n()
    const handler = createCsrfTokenHandler(i18n)

    const req = { session: {} }
    let statusCode = null
    let sentData = null
    const res = {
        status: (code) => {
            statusCode = code
            return res
        },
        send: (data) => {
            sentData = data
            return res
        },
    }

    handler(req, res)

    assert.equal(statusCode, 200)
    assert.ok(sentData.csrfToken)
    assert.equal(sentData.csrfToken.length, 64)
})

test('createCsrfTokenHandler returns error if no session', () => {
    const i18n = createMockI18n()
    const handler = createCsrfTokenHandler(i18n)

    const req = {} // No session
    let statusCode = null
    const res = {
        status: (code) => {
            statusCode = code
            return res
        },
        send: () => res,
    }

    handler(req, res)

    assert.equal(statusCode, 500)
})

// --- createCsrfProtection tests ---
test('createCsrfProtection allows request without session for /toProccess', () => {
    const i18n = createMockI18n()
    const middleware = createCsrfProtection(i18n)

    const req = { path: '/toProccess', session: {} }
    let nextCalled = false
    const next = () => {
        nextCalled = true
    }
    const res = {}

    middleware(req, res, next)

    assert.equal(nextCalled, true)
})

test('createCsrfProtection allows request without session for /logout', () => {
    const i18n = createMockI18n()
    const middleware = createCsrfProtection(i18n)

    const req = { path: '/logout', session: {} }
    let nextCalled = false
    const next = () => {
        nextCalled = true
    }
    const res = {}

    middleware(req, res, next)

    assert.equal(nextCalled, true)
})

test('createCsrfProtection rejects when no expected token', () => {
    const i18n = createMockI18n()
    const middleware = createCsrfProtection(i18n)

    const req = {
        path: '/api/action',
        session: { userId: 1 }, // Has user but no CSRF token
        get: () => 'some-token',
    }
    let statusCode = null
    const res = {
        status: (code) => {
            statusCode = code
            return res
        },
        send: () => res,
    }

    middleware(req, res, () => {})

    assert.equal(statusCode, 403)
})

test('createCsrfProtection rejects when token mismatch', () => {
    const i18n = createMockI18n()
    const middleware = createCsrfProtection(i18n)

    const req = {
        path: '/api/action',
        session: { userId: 1, csrfToken: 'expected-token' },
        get: () => 'wrong-token',
    }
    let statusCode = null
    const res = {
        status: (code) => {
            statusCode = code
            return res
        },
        send: () => res,
    }

    middleware(req, res, () => {})

    assert.equal(statusCode, 403)
})

test('createCsrfProtection allows when token matches', () => {
    const i18n = createMockI18n()
    const middleware = createCsrfProtection(i18n)

    const req = {
        path: '/api/action',
        session: { userId: 1, csrfToken: 'valid-token' },
        get: () => 'valid-token',
    }
    let nextCalled = false
    const next = () => {
        nextCalled = true
    }
    const res = {}

    middleware(req, res, next)

    assert.equal(nextCalled, true)
})
