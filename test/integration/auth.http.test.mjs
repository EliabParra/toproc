import { describe, it, before } from 'node:test'
import assert from 'node:assert/strict'
import request from 'supertest'
import { AppServer } from '../../src/api/AppServer.js'
import { AuthQueries } from '../../BO/Auth/AuthQueries.js'

// Mock Data
const MOCK_USER = {
    id: 1,
    username: 'TestUser',
    email: 'test@example.com',
    password_hash: '$2a$10$XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX', // Valid bcrypt hash if needed, or mocked check
    email_verified_at: new Date(),
    profile_id: 1,
}

const MOCK_PROFILE_PERMISSIONS = {
    1: {
        Auth: [
            'register',
            'login',
            'logout',
            'requestEmailVerification',
            'verifyEmail',
            'requestPasswordReset',
            'verifyPasswordReset',
            'resetPassword',
        ],
        User: ['getProfile'],
    },
    2: {
        Auth: [
            'register',
            'requestEmailVerification',
            'verifyEmail',
            'requestPasswordReset',
            'verifyPasswordReset',
            'resetPassword',
        ],
    },
}

// Helper to create deps
function createDeps() {
    const logs = []
    const log = {
        trace: () => {},
        debug: () => {},
        info: (msg) => logs.push({ type: 2, msg }),
        warn: (msg) => logs.push({ type: 3, msg }),
        error: (msg) => logs.push({ type: 1, msg }),
        critical: () => logs.push({ type: 1, msg }),
        child: () => log,
    }

    const config = {
        app: { name: 'TestApp', port: 0, host: 'localhost', lang: 'en', trustProxy: false },
        auth: {
            publicProfileId: 2,
            sessionProfileId: 1,
            emailVerificationPurpose: 'ev',
            passwordResetPurpose: 'pr',
        },
        db: {},
        log: { activation: [true, true, true, true] },
        bo: { path: '../../BO/' }, // Relative to CWD (root)
        session: { secret: 'test-secret', resave: false, saveUninitialized: false },
    }

    const i18n = {
        get: (k) => {
            if (k === 'errors.server')
                return {
                    serverError: { code: 500, msg: 'Server Error' },
                    txNotFound: { msg: 'Tx {tx} not found' },
                }
            if (k === 'errors.client')
                return {
                    unknown: { code: 500 },
                    csrfInvalid: { code: 403, msg: 'CSRF Invalid' },
                    permissionDenied: { code: 403, msg: 'Denied' },
                    login: { code: 401, msg: 'Login Required' },
                    invalidParameters: { code: 400, msg: 'Invalid Params' },
                    serviceUnavailable: { code: 503, msg: 'Service Unavailable' },
                }
            if (k === 'success') return { logout: { code: 200, msg: 'Logged out' } }
            return {}
        },
        get messages() {
            return {
                errors: {
                    server: {
                        serverError: { code: 500, msg: 'Server Error' },
                        txNotFound: { msg: 'Tx {tx} not found' },
                    },
                    client: {
                        unknown: { code: 500 },
                        csrfInvalid: { code: 403, msg: 'CSRF Invalid' },
                        permissionDenied: { code: 403, msg: 'Denied' },
                        login: { code: 401, msg: 'Login Required' },
                        invalidParameters: { code: 400, msg: 'Invalid Params' },
                        serviceUnavailable: { code: 503, msg: 'Service Unavailable' },
                    },
                },
                success: {
                    logout: { code: 200, msg: 'Logged out' },
                },
                alerts: {
                    invalidBody: 'Invalid body',
                    invalidTx: 'Invalid tx',
                    paramsType: 'Invalid params',
                },
            }
        },
        translate: (k) => k,
        error: (k) => {
            const map = {
                'errors.client.csrfInvalid': { code: 403, msg: 'CSRF Invalid' },
                'errors.client.permissionDenied': { code: 403, msg: 'Denied' },
            }
            return map[k] || { msg: k, code: 400 }
        },
        use: () => ({ registerSuccess: 'Registered!', emailVerified: 'Verified!' }), // Mock BO messages
        format: (t, p) => t,
    }

    const audit = {
        log: async () => {},
    }

    const sessionService = {
        sessionExists: (req) => !!req.session?.userId,
        createSession: async (req) => {
            const body = req.body
            if (body.loginId === 'test@example.com' && body.password === 'password') {
                req.session.userId = 1
                req.session.profileId = 1
                return {
                    status: 'success',
                    user: { id: 1, username: 'TestUser', email: body.loginId, profile_id: 1 },
                    msg: { code: 200, msg: 'Login OK' },
                }
            }
            return {
                status: 'error',
                error: { code: 401, msg: 'Auth Failed' },
            }
        },
        destroySession: (req) => {
            req.session.destroy()
        },
    }

    // DB Mock
    const db = {
        query: async (queryDef, params) => {
            const sql = typeof queryDef === 'string' ? queryDef : queryDef.sql

            // Permissions
            if (sql.includes('permission_methods')) {
                // Return all permissions
                const rows = []
                for (const [pid, perms] of Object.entries(MOCK_PROFILE_PERMISSIONS)) {
                    for (const [obj, methods] of Object.entries(perms)) {
                        for (const m of methods) {
                            rows.push({ profile_id: Number(pid), object_name: obj, method_name: m })
                        }
                    }
                }
                return { rows }
            }
            if (sql.includes('security.methods')) {
                // Map tx 100 to Auth.register
                // We need to support dynamic resolution or meaningful mocks
                // The SecurityService loads this map.
                return {
                    rows: [
                        { tx: 101, object_name: 'Auth', method_name: 'register' },
                        { tx: 102, object_name: 'Auth', method_name: 'verifyEmail' },
                    ],
                }
            }

            // Auth Queries
            if (sql.includes('WHERE u.email = $1')) {
                // getUserByEmail
                if (params[0] === 'test@example.com') return { rows: [MOCK_USER] }
                return { rows: [] }
            }
            if (sql.includes('INSERT INTO security.users')) {
                return { rows: [{ id: 2 }] } // New user
            }
            if (sql.includes('INSERT INTO security.user_profiles')) {
                return { rows: [] }
            }
            if (sql.includes('INSERT INTO security.one_time_codes')) {
                return { rows: [{ id: 1 }] }
            }

            return { rows: [] }
        },
    }

    // We need Real SecurityService to test BO execution
    // But SecurityService needs DB.
    // I'll factory a real SecurityService.

    // Mock Validator
    const validator = {
        validate: (d) => ({ valid: true, data: d }),
    }

    return { config, log, i18n, audit, session: sessionService, db, logs, validator }
}

import { SecurityService } from '../../src/services/SecurityService.js'

describe('Auth Module Integration (HTTP)', async () => {
    let app
    let appServer
    let csrfToken
    let testDeps

    before(async () => {
        const deps = createDeps()
        testDeps = deps

        // Use Real SecurityService
        const security = new SecurityService({
            db: deps.db,
            log: deps.log,
            config: deps.config,
            i18n: deps.i18n,
            audit: deps.audit,
            session: deps.session,
            validator: { validate: (d, s) => ({ valid: true, data: d }) }, // Bypass validation, pass data (arg1)
        })
        await security.init()

        appServer = new AppServer({
            ...deps,
            security,
        })
        await appServer.init()
        app = appServer.app
    })

    it('1. Should obtain CSRF token', async () => {
        const res = await request(app).get('/csrf')
        assert.equal(res.status, 200)
        assert.ok(res.body.csrfToken)
        csrfToken = res.body.csrfToken
        // Also verify cookie is set? GET /csrf usually sets session cookie if not exists
    })

    it('2. Should reject Login without CSRF token', async () => {
        const res = await request(app)
            .post('/login')
            .send({ loginId: 'test@example.com', password: 'password' })

        // Without token, it should be 403 (or whatever csrf middleware returns)

        assert.equal(res.status, 403)
    })

    it('3. Should Login with valid credentials and CSRF', async () => {
        // We need an agent to persist cookies (session)
        const agent = request.agent(app)

        // Get CSRF first (sets cookie)
        const r1 = await agent.get('/csrf')
        const token = r1.body.csrfToken

        const res = await agent
            .post('/login')
            .set('X-CSRF-Token', token)
            .send({ loginId: 'test@example.com', password: 'password' })

        if (res.status !== 200) {
            console.error('Login FAILS. Status:', res.status)
            console.error('Body:', JSON.stringify(res.body, null, 2))
        }
        assert.equal(res.status, 200)
        assert.equal(res.body.msg, 'Login OK')

        // Store agent for logout test?
    })

    it('4. Should Register (BO Execution) via /toProccess', async () => {
        const agent = request.agent(app)
        const r1 = await agent.get('/csrf')
        const token = r1.body.csrfToken

        // Tx 101 = Auth.register defined in mock
        const payload = {
            tx: 101,
            params: {
                name: 'New User',
                email: 'new@example.com',
                password: 'password123',
                confirmPassword: 'password123',
            },
        }

        const res = await agent.post('/toProccess').set('X-CSRF-Token', token).send(payload)

        // Check verification
        // Expected: 200 or 201
        // Since we bypassed strict validation in 'v' mock, assume data passes
        // But Schema validation inside BO?
        // BaseBO uses 'this.v'. deps.validator is mocked to always return valid: true.
        // So BO validation passes.
        // AuthService.insertUser called.
        // Returns success.

        if (res.status !== 200 && res.status !== 201) {
            console.error('Register FAILS. Status:', res.status)
            const logs = testDeps?.logs || []
            const errLog = logs.find((l) => l.type === 1) // Find TYPE_ERROR
            if (errLog) {
                console.error('BaseBO Error Msg:', errLog.ctx?.message || errLog.msg)
                if (errLog.ctx?.stack) console.error('Stack:', errLog.ctx.stack.split('\n')[0])
                if (errLog.ctx && !errLog.ctx.message && !errLog.ctx.stack)
                    console.error('Ctx:', JSON.stringify(errLog.ctx))
            } else {
                console.error('No error log found')
            }
        }
        assert.ok(res.status === 200 || res.status === 201, 'Status should be success')
        assert.ok(res.body.code === 200 || res.body.code === 201)
    })

    it('5. Should Logout', async () => {
        const agent = request.agent(app)
        const r1 = await agent.get('/csrf') // New session
        const token = r1.body.csrfToken

        // Login first
        await agent
            .post('/login')
            .set('X-CSRF-Token', token)
            .send({ loginId: 'test@example.com', password: 'password' })

        const res = await agent.post('/logout').set('X-CSRF-Token', token).send({})

        assert.equal(res.status, 200)
    })
})
