import test from 'node:test'
import assert from 'node:assert/strict'

import { applyRequestId } from '../src/api/http/middleware/request-id.js'
import { applyCorsIfEnabled } from '../src/api/http/middleware/cors.js'

// --- applyRequestId tests ---
test('applyRequestId adds middleware to app', () => {
    let middlewareAdded = false
    const mockApp = {
        use: (fn) => {
            middlewareAdded = true
            assert.equal(typeof fn, 'function')
        },
    }

    applyRequestId(mockApp)
    assert.equal(middlewareAdded, true)
})

test('applyRequestId middleware sets requestId on req', () => {
    let capturedMiddleware = null
    const mockApp = {
        use: (fn) => {
            capturedMiddleware = fn
        },
    }

    applyRequestId(mockApp)

    const mockReq = {}
    const mockRes = { setHeader: () => {} }
    let nextCalled = false
    const next = () => {
        nextCalled = true
    }

    capturedMiddleware(mockReq, mockRes, next)

    assert.ok(mockReq.requestId)
    assert.ok(typeof mockReq.requestId === 'string')
    assert.equal(nextCalled, true)
})

test('applyRequestId middleware sets requestStartMs', () => {
    let capturedMiddleware = null
    const mockApp = {
        use: (fn) => {
            capturedMiddleware = fn
        },
    }

    applyRequestId(mockApp)

    const mockReq = {}
    const mockRes = { setHeader: () => {} }

    capturedMiddleware(mockReq, mockRes, () => {})

    assert.ok(typeof mockReq.requestStartMs === 'number')
    assert.ok(mockReq.requestStartMs <= Date.now())
})

test('applyRequestId middleware sets X-Request-Id header', () => {
    let capturedMiddleware = null
    const mockApp = {
        use: (fn) => {
            capturedMiddleware = fn
        },
    }

    applyRequestId(mockApp)

    const mockReq = {}
    let headerName = null
    let headerValue = null
    const mockRes = {
        setHeader: (name, value) => {
            headerName = name
            headerValue = value
        },
    }

    capturedMiddleware(mockReq, mockRes, () => {})

    assert.equal(headerName, 'X-Request-Id')
    assert.equal(headerValue, mockReq.requestId)
})

// --- applyCorsIfEnabled tests ---
test('applyCorsIfEnabled does nothing when cors is disabled', () => {
    let middlewareAdded = false
    const mockApp = {
        use: () => {
            middlewareAdded = true
        },
    }
    const config = { cors: { enabled: false } }

    applyCorsIfEnabled(mockApp, config)

    assert.equal(middlewareAdded, false)
})

test('applyCorsIfEnabled does nothing when cors config is missing', () => {
    let middlewareAdded = false
    const mockApp = {
        use: () => {
            middlewareAdded = true
        },
    }
    const config = {}

    applyCorsIfEnabled(mockApp, config)

    assert.equal(middlewareAdded, false)
})

test('applyCorsIfEnabled adds middleware when cors is enabled', () => {
    let middlewareAdded = false
    const mockApp = {
        use: () => {
            middlewareAdded = true
        },
    }
    const config = {
        cors: {
            enabled: true,
            origins: ['http://localhost:3000'],
            credentials: true,
        },
    }

    applyCorsIfEnabled(mockApp, config)

    assert.equal(middlewareAdded, true)
})

test('applyCorsIfEnabled handles empty origins array', () => {
    let middlewareAdded = false
    const mockApp = {
        use: () => {
            middlewareAdded = true
        },
    }
    const config = {
        cors: {
            enabled: true,
            origins: [],
            credentials: false,
        },
    }

    applyCorsIfEnabled(mockApp, config)

    assert.equal(middlewareAdded, true)
})

test('applyCorsIfEnabled handles missing origins', () => {
    let middlewareAdded = false
    const mockApp = {
        use: () => {
            middlewareAdded = true
        },
    }
    const config = {
        cors: {
            enabled: true,
            credentials: true,
        },
    }

    applyCorsIfEnabled(mockApp, config)

    assert.equal(middlewareAdded, true)
})
