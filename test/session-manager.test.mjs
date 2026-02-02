import test from 'node:test'
import assert from 'node:assert/strict'

import { SessionManager } from '../src/services/SessionService.js'
// Assuming this path is correct or will be fixed if broken, keeping original
import { ValidatorService } from '../src/services/ValidatorService.js'

// Mock i18n data
const mockLocaleData = {
    alerts: {
        notEmpty: 'NotEmpty',
        email: 'EmailInvalid',
        lengthMin: 'TooShort',
        lengthMax: 'TooLong',
        string: 'MustBeString',
        number: 'MustBeNumber',
    },
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
            return typeof val === 'object' ? val : { msg: key, code: 500 }
        },
        get: (key) => {
            const parts = key.split('.')
            let val = mockLocaleData
            for (const p of parts) val = val?.[p]
            return val
        },
        // AppValidator requirements
        messages: mockLocaleData,
        format: (msg, params) => `${msg}:${JSON.stringify(params)}`,
    }
}

// Helper to create mock dependencies
function createMockDeps(overrides = {}) {
    const i18n = createMockI18n()
    const validator = new ValidatorService(i18n)

    return {
        db: { query: async () => ({ rows: [] }), exe: async () => ({ rows: [] }) },
        log: {
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
                error: (msg) => {
                    if (msg) logCalled = true
                }, // simplistic for the specific test relying on logCalled closure in one test, but safer to just recurse or return dummy.
                critical: () => {},
            }),
        },
        config: {
            app: { lang: 'es' },
            auth: { loginId: 'email', requireEmailVerification: false },
        },
        i18n,
        email: {
            send: async () => ({ ok: true, mode: 'log' }),
            sendTemplate: async () => ({ ok: true, mode: 'log' }),
            maskEmail: (e) => e.replace(/(?<=^.).+(?=@)/, '***'),
        },
        audit: { log: async () => {} },
        validator, // Inject real AppValidator with mock i18n
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
    const req = { session: { userId: 123 } }

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

// --- createSession tests (Updated for Clean Architecture) ---

test('createSession returns error if session already exists', async () => {
    const deps = createMockDeps()
    const sm = new SessionManager(deps)

    const req = {
        body: { identifier: 'user@test.com', password: 'password123' },
        session: { userId: 1 },
    }

    const result = await sm.createSession(req)

    assert.equal(result.status, 'error')
    assert.equal(result.error.code, 400)
    assert.equal(result.error.msg, 'Session exists')
})

test('createSession returns error for non-existent user', async () => {
    const deps = createMockDeps({
        db: { query: async () => ({ rows: [] }) },
    })
    const sm = new SessionManager(deps)

    const req = {
        body: { identifier: 'nonexistent@test.com', password: 'password123' },
        session: {},
    }

    const result = await sm.createSession(req)

    assert.equal(result.status, 'error')
    assert.equal(result.error.code, 401) // Incorrect credentials
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

    const result = await sm.createSession(req)

    // Check for new schema column name or query logic
    assert.ok(sqlCalled.includes('u.username = $1'), 'Should use username lookup query')
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

    await sm.createSession(req)

    // Check for new schema column name
    assert.ok(sqlCalled.includes('u.email = $1'), 'Should use email lookup query')
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
            trace: () => {},
            debug: () => {},
            info: () => {},
            warn: () => {},
            error: () => {
                logCalled = true
            },
            critical: () => {},
            child: () => ({
                error: (msg) => {
                    if (msg) logCalled = true
                },
            }),
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

    const result = await sm.createSession(req)

    assert.equal(result.status, 'error')
    assert.equal(result.error.code, 500)
    assert.equal(logCalled, true)
})
