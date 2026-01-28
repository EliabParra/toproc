import test from 'node:test'
import assert from 'node:assert/strict'

import {
    ensureCsrfToken,
    createCsrfTokenHandler,
    createCsrfProtection,
} from '../src/api/http/middleware/csrf.js'
import { createHealthHandler } from '../src/api/http/handlers/health.js'

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
    const deps = {
        config: { app: { lang: 'es' } },
        msgs: { es: { errors: { client: { unknown: { code: 500, msg: 'Unknown' } } } } },
    }
    const handler = createCsrfTokenHandler(deps)

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
    const deps = {
        config: { app: { lang: 'es' } },
        msgs: { es: { errors: { client: { unknown: { code: 500, msg: 'Unknown' } } } } },
    }
    const handler = createCsrfTokenHandler(deps)

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
    const deps = {
        config: { app: { lang: 'es' } },
        msgs: { es: { errors: { client: { csrfInvalid: { code: 403, msg: 'Invalid CSRF' } } } } },
    }
    const middleware = createCsrfProtection(deps)

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
    const deps = {
        config: { app: { lang: 'es' } },
        msgs: { es: { errors: { client: { csrfInvalid: { code: 403, msg: 'Invalid CSRF' } } } } },
    }
    const middleware = createCsrfProtection(deps)

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
    const deps = {
        config: { app: { lang: 'es' } },
        msgs: { es: { errors: { client: { csrfInvalid: { code: 403, msg: 'Invalid CSRF' } } } } },
    }
    const middleware = createCsrfProtection(deps)

    const req = {
        path: '/api/action',
        session: { user_id: 1 }, // Has user but no CSRF token
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
    const deps = {
        config: { app: { lang: 'es' } },
        msgs: { es: { errors: { client: { csrfInvalid: { code: 403, msg: 'Invalid CSRF' } } } } },
    }
    const middleware = createCsrfProtection(deps)

    const req = {
        path: '/api/action',
        session: { user_id: 1, csrfToken: 'expected-token' },
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
    const deps = {
        config: { app: { lang: 'es' } },
        msgs: { es: { errors: { client: { csrfInvalid: { code: 403, msg: 'Invalid CSRF' } } } } },
    }
    const middleware = createCsrfProtection(deps)

    const req = {
        path: '/api/action',
        session: { user_id: 1, csrfToken: 'valid-token' },
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

// --- createHealthHandler tests ---
test('createHealthHandler returns handler function', () => {
    const handler = createHealthHandler({ name: 'test-app' })
    assert.equal(typeof handler, 'function')
})

test('createHealthHandler returns 200 with health info', () => {
    const handler = createHealthHandler({ name: 'my-service' })

    const req = { requestId: 'req-123' }
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
    assert.equal(sentData.ok, true)
    assert.equal(sentData.name, 'my-service')
    assert.equal(sentData.requestId, 'req-123')
    assert.ok(typeof sentData.uptimeSec === 'number')
    assert.ok(typeof sentData.time === 'string')
})
