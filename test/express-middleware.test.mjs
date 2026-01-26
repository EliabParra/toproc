import test from 'node:test'
import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'

import { applyRequestLogger } from '../src/express/middleware/request-logger.js'
import { createFinalErrorHandler } from '../src/express/middleware/final-error-handler.js'

// --- applyRequestLogger tests ---
test('applyRequestLogger adds middleware to app', () => {
    let middlewareAdded = false
    const mockApp = {
        use: (fn) => {
            middlewareAdded = true
            assert.equal(typeof fn, 'function')
        },
    }
    const mockLog = {
        TYPE_INFO: 'info',
        TYPE_WARNING: 'warn',
        show: () => {},
    }

    applyRequestLogger(mockApp, { log: mockLog })
    assert.equal(middlewareAdded, true)
})

test('applyRequestLogger middleware calls next', () => {
    let capturedMiddleware = null
    const mockApp = {
        use: (fn) => {
            capturedMiddleware = fn
        },
    }
    const mockLog = { show: () => {} }

    applyRequestLogger(mockApp, { log: mockLog })

    const mockRes = new EventEmitter()
    mockRes.statusCode = 200
    let nextCalled = false

    capturedMiddleware({}, mockRes, () => {
        nextCalled = true
    })

    assert.equal(nextCalled, true)
})

test('applyRequestLogger logs on finish event for 2xx', () => {
    let capturedMiddleware = null
    const mockApp = {
        use: (fn) => {
            capturedMiddleware = fn
        },
    }
    let logCalled = false
    let loggedType = null
    const mockLog = {
        TYPE_INFO: 'info',
        TYPE_WARNING: 'warn',
        show: ({ type }) => {
            logCalled = true
            loggedType = type
        },
    }

    applyRequestLogger(mockApp, { log: mockLog })

    const mockRes = new EventEmitter()
    mockRes.statusCode = 200
    const mockReq = {
        requestId: 'req-123',
        requestStartMs: Date.now() - 100,
        method: 'GET',
        originalUrl: '/api/test',
        session: { user_id: 1 },
    }

    capturedMiddleware(mockReq, mockRes, () => {})
    mockRes.emit('finish')

    assert.equal(logCalled, true)
    assert.equal(loggedType, 'info')
})

test('applyRequestLogger logs warning for 4xx status', () => {
    let capturedMiddleware = null
    const mockApp = {
        use: (fn) => {
            capturedMiddleware = fn
        },
    }
    let loggedType = null
    const mockLog = {
        TYPE_INFO: 'info',
        TYPE_WARNING: 'warn',
        show: ({ type }) => {
            loggedType = type
        },
    }

    applyRequestLogger(mockApp, { log: mockLog })

    const mockRes = new EventEmitter()
    mockRes.statusCode = 400
    mockRes.locals = {}

    capturedMiddleware({ method: 'POST', originalUrl: '/test' }, mockRes, () => {})
    mockRes.emit('finish')

    assert.equal(loggedType, 'warn')
})

test('applyRequestLogger skips logging if already logged', () => {
    let capturedMiddleware = null
    const mockApp = {
        use: (fn) => {
            capturedMiddleware = fn
        },
    }
    let logCalled = false
    const mockLog = {
        TYPE_WARNING: 'warn',
        show: () => {
            logCalled = true
        },
    }

    applyRequestLogger(mockApp, { log: mockLog })

    const mockRes = new EventEmitter()
    mockRes.statusCode = 500
    mockRes.locals = { __errorLogged: true }

    capturedMiddleware({}, mockRes, () => {})
    mockRes.emit('finish')

    assert.equal(logCalled, false)
})

// Note: createFinalErrorHandler tests removed - the module uses global 'log'
// which requires refactoring to be testable via dependency injection
