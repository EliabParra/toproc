import test from 'node:test'
import assert from 'node:assert/strict'

import { AuditService } from '../src/services/AuditService.js'

test('AuditService.log redacts secrets in details before insert', async () => {
    const calls = []
    const dbStub = {
        query: async (query, params) => {
            calls.push(['security', query, params]) // Adapting to test expectation of [schema, query, params]
            return { rows: [] }
        },
    }

    const mockLog = {
        child: () => mockLog,
        info: () => {},
        error: () => {},
        debug: () => {},
    }
    const audit = new AuditService({ db: dbStub, log: mockLog })

    const req = {
        requestId: 'req-1',
        session: { user_id: 10, profile_id: 20 },
    }

    const secretToken = 'tok_1234567890'
    const secretCode = '123456'
    const secretPassword = 'SuperSecret!'

    await audit.log(req, {
        action: 'test',
        object_na: 'Auth',
        method_na: 'resetPassword',
        tx: 3,
        details: {
            token: secretToken,
            code: secretCode,
            newPassword: secretPassword,
            nested: { password: secretPassword, ok: true },
        },
    })

    assert.equal(calls.length, 1)
    const [schema, query, params] = calls[0]
    assert.equal(schema, 'security')
    assert.match(query, /INSERT INTO security.audit_logs/)

    const metaJson = params[7]
    const meta = JSON.parse(metaJson)

    assert.equal(meta.token, '[REDACTED]')
    assert.equal(meta.code, '[REDACTED]')
    assert.equal(meta.newPassword, '[REDACTED]')
    assert.equal(meta.nested.password, '[REDACTED]')
    assert.equal(meta.nested.ok, true)

    assert.ok(!metaJson.includes(secretToken))
    assert.ok(!metaJson.includes(secretCode))
    assert.ok(!metaJson.includes(secretPassword))
})
