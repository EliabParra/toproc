import test from 'node:test'
import assert from 'node:assert/strict'

import { SessionManager } from '../src/services/SessionService.js'

// Mock i18n data
const mockLocaleData = {
    errors: {
        server: { serverError: { msg: 'Server Error', code: 500 } },
        client: {
            invalidParameters: { msg: 'Invalid Parameters', code: 400 },
            sessionExists: { msg: 'Session exists', code: 400 },
            usernameOrPasswordIncorrect: { msg: 'Incorrect', code: 401 },
            emailRequired: { msg: 'Email required', code: 400 },
            emailNotVerified: { msg: 'Email not verified', code: 403 },
            unknown: { msg: 'Unknown error', code: 500 },
        },
    },
    success: {
        login: { msg: 'Login successful', code: 200 },
    },
}

// Mock i18n service
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
            return typeof val === 'object' ? val : { msg: key, code: 500 }
        },
        get: (key) => {
            const parts = key.split('.')
            let val = mockLocaleData
            for (const p of parts) val = val?.[p]
            return val
        },
    }
}

// Helper to create mock dependencies
function createMockDeps(overrides = {}) {
    return {
        db: { query: async () => ({ rows: [] }), exe: async () => ({ rows: [] }) },
        log: {
            TYPE_INFO: 'info',
            TYPE_WARNING: 'warn',
            TYPE_ERROR: 'error',
            show: () => {},
        },
        config: {
            app: { lang: 'es' },
            auth: { loginId: 'email', requireEmailVerification: false },
        },
        i18n: createMockI18n(),
        email: { send: async () => {} },
        audit: { log: async () => {} },
        v: { getMessage: (type, param) => `${type}:${param?.label || 'field'}` },
        ...overrides,
    }
}

// --- Constructor tests ---
test('SessionManager constructor initializes correctly', () => {
    const deps = createMockDeps()
    const sm = new SessionManager(deps)
    assert.ok(sm)
})

test('SessionManager constructor handles missing auth config', () => {
    const deps = createMockDeps({
        config: { app: { lang: 'es' } },
    })
    const sm = new SessionManager(deps)
    assert.ok(sm)
})

// --- sessionExists tests ---
test('sessionExists returns true when session has user_id', () => {
    const deps = createMockDeps()
    const sm = new SessionManager(deps)
    const req = { session: { user_id: 123 } }

    assert.equal(sm.sessionExists(req), true)
})

test('sessionExists returns false when session is empty', () => {
    const deps = createMockDeps()
    const sm = new SessionManager(deps)
    const req = { session: {} }

    assert.equal(sm.sessionExists(req), false)
})

test('sessionExists returns false when no session', () => {
    const deps = createMockDeps()
    const sm = new SessionManager(deps)
    const req = {}

    assert.equal(sm.sessionExists(req), false)
})

// --- destroySession tests ---
test('destroySession calls session.destroy', () => {
    const deps = createMockDeps()
    const sm = new SessionManager(deps)
    let destroyCalled = false
    const req = {
        session: {
            destroy: () => {
                destroyCalled = true
            },
        },
    }

    sm.destroySession(req)
    assert.equal(destroyCalled, true)
})

test('destroySession handles missing session gracefully', () => {
    const deps = createMockDeps()
    const sm = new SessionManager(deps)
    const req = {}

    // Should not throw
    sm.destroySession(req)
    assert.ok(true)
})

test('destroySession handles missing destroy method gracefully', () => {
    const deps = createMockDeps()
    const sm = new SessionManager(deps)
    const req = { session: {} }

    // Should not throw
    sm.destroySession(req)
    assert.ok(true)
})

// --- createSession tests ---
test('createSession returns 400 for invalid body', async () => {
    const deps = createMockDeps()
    const sm = new SessionManager(deps)

    const req = { body: {} } // Missing identifier and password
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

    await sm.createSession(req, res)

    assert.equal(statusCode, 400)
    assert.ok(sentData.alerts)
})

test('createSession returns 400 if session already exists', async () => {
    const deps = createMockDeps()
    const sm = new SessionManager(deps)

    const req = {
        body: { identifier: 'user@test.com', password: 'password123' },
        session: { user_id: 1 },
    }
    let statusCode = null
    const res = {
        status: (code) => {
            statusCode = code
            return res
        },
        send: () => res,
    }

    await sm.createSession(req, res)

    assert.equal(statusCode, 400)
})

test('createSession returns 401 for non-existent user', async () => {
    const deps = createMockDeps({
        db: { query: async () => ({ rows: [] }) },
    })
    const sm = new SessionManager(deps)

    const req = {
        body: { identifier: 'nonexistent@test.com', password: 'password123' },
        session: {},
    }
    let statusCode = null
    const res = {
        status: (code) => {
            statusCode = code
            return res
        },
        send: () => res,
    }

    await sm.createSession(req, res)

    assert.equal(statusCode, 401)
})

test('createSession uses getUserByUsername for non-email identifier', async () => {
    let sqlCalled = null
    const deps = createMockDeps({
        db: {
            query: async (sql) => {
                if (!sqlCalled) sqlCalled = sql
                return { rows: [] }
            },
        },
    })
    const sm = new SessionManager(deps)

    const req = {
        body: { identifier: 'admin', password: 'password123' },
        session: {},
    }
    const res = {
        status: () => res,
        send: () => res,
    }

    await sm.createSession(req, res)

    assert.ok(sqlCalled.includes('user_na = $1'), 'Should use username lookup query')
})

test('createSession uses getUserByEmail for email identifier', async () => {
    let sqlCalled = null
    const deps = createMockDeps({
        db: {
            query: async (sql) => {
                if (!sqlCalled) sqlCalled = sql
                return { rows: [] }
            },
        },
    })
    const sm = new SessionManager(deps)

    const req = {
        body: { identifier: 'user@email.com', password: 'password123' },
        session: {},
    }
    const res = {
        status: () => res,
        send: () => res,
    }

    await sm.createSession(req, res)

    assert.ok(sqlCalled.includes('user_em = $1'), 'Should use email lookup query')
})

test('createSession handles error gracefully and logs', async () => {
    let logCalled = false
    const deps = createMockDeps({
        db: {
            query: async () => {
                throw new Error('DB Error')
            },
        },
        log: {
            TYPE_ERROR: 'error',
            show: () => {
                logCalled = true
            },
        },
    })
    const sm = new SessionManager(deps)

    const req = {
        body: { identifier: 'user@test.com', password: 'password123' },
        session: {},
        requestId: 'req-123',
        method: 'POST',
        originalUrl: '/login',
    }
    let statusCode = null
    const res = {
        status: (code) => {
            statusCode = code
            return res
        },
        send: () => res,
        locals: {},
    }

    await sm.createSession(req, res)

    assert.equal(statusCode, 500)
    assert.equal(logCalled, true)
})
