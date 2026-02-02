import test from 'node:test'
import assert from 'node:assert/strict'
import path from 'node:path'
import { EmailService } from '../../src/services/EmailService.js'

// Mock Logger
const mockLog = {
    child: () => mockLog,
    info: () => {},
    error: () => {},
    debug: () => {},
}

// Mock Config
const mockConfig = {
    email: {
        mode: 'log',
        from: 'test@example.com',
    },
}

test('EmailService.send (log mode) returns ok', async () => {
    const service = new EmailService({ log: mockLog, config: mockConfig })
    const result = await service.send({
        to: 'user@example.com',
        subject: 'Test Subject',
        text: 'Hello World',
    })

    assert.equal(result.ok, true)
    assert.equal(result.mode, 'log')
})

test('EmailService.sendTemplate interpolates variables correctly', async () => {
    const service = new EmailService({ log: mockLog, config: mockConfig })

    // We rely on the actual template file existing in src/templates/emails/auth/login-challenge.html
    // This is an integration test behavior but acceptable here.
    const result = await service.sendTemplate({
        to: 'user@example.com',
        subject: 'Login Challenge',
        templatePath: 'auth/login-challenge.html',
        data: {
            appName: 'TestApp',
            code: '123456',
        },
    })

    assert.equal(result.ok, true)

    // In 'log' mode, we can't easily inspect the 'html' body unless we spy on log.info
    // So let's spy on log.info
    let loggedData = null
    const spyLog = {
        child: () => spyLog,
        info: (msg, data) => {
            loggedData = data
        },
        error: () => {},
    }

    const verboseService = new EmailService({
        log: spyLog,
        config: { ...mockConfig, email: { ...mockConfig.email, logIncludeSecrets: true } },
    })

    await verboseService.sendTemplate({
        to: 'user@example.com',
        subject: 'Login Challenge',
        templatePath: 'auth/login-challenge.html',
        data: {
            appName: 'TestApp',
            code: '999999',
        },
    })

    assert.ok(loggedData)
    assert.match(loggedData.body, /TestApp/)
    assert.match(loggedData.body, /999999/)
})

test('EmailService.sendTemplate handles missing template gracefully', async () => {
    const service = new EmailService({ log: mockLog, config: mockConfig })

    const result = await service.sendTemplate({
        to: 'user@example.com',
        subject: 'Missing',
        templatePath: 'does-not-exist.html',
        data: {},
    })

    // Should fail or fallback? Implementation says fallback to text error.
    assert.equal(result.ok, true)

    let loggedError = null
    const spyLog = {
        child: () => spyLog,
        info: () => {},
        error: (msg) => {
            loggedError = msg
        },
    }
    const errorService = new EmailService({ log: spyLog, config: mockConfig })

    await errorService.sendTemplate({
        to: 'u',
        subject: 's',
        templatePath: 'missing.html',
        data: {},
    })

    assert.ok(loggedError)
    assert.match(loggedError, /Error loading template/)
})
