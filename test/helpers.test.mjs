import test from 'node:test'
import assert from 'node:assert/strict'

import { redactSecretsInString, redactSecrets } from '../src/utils/sanitize.js'
import { errorMessage } from '../src/utils/error.js'

// --- redactSecretsInString tests ---
test('redactSecretsInString redacts password in query string', () => {
    const input = 'user=admin&password=secret123&action=login'
    const result = redactSecretsInString(input)
    assert.match(result, /password=\[REDACTED\]/)
    assert.doesNotMatch(result, /secret123/)
})

test('redactSecretsInString redacts password in JSON', () => {
    const input = '{"username": "admin", "password": "secret123"}'
    const result = redactSecretsInString(input)
    assert.match(result, /\[REDACTED\]/)
    assert.doesNotMatch(result, /secret123/)
})

test('redactSecretsInString handles string without secrets', () => {
    const input = 'just a normal string'
    const result = redactSecretsInString(input)
    assert.equal(result, input)
})

test('redactSecretsInString handles empty string', () => {
    assert.equal(redactSecretsInString(''), '')
})

// --- redactSecrets tests ---
test('redactSecrets redacts password field', () => {
    const input = { username: 'admin', password: 'secret123' }
    const result = redactSecrets(input)
    assert.equal(result.password, '[REDACTED]')
    assert.equal(result.username, 'admin')
})

test('redactSecrets redacts token field', () => {
    const input = { data: 'ok', token: 'abc123xyz' }
    const result = redactSecrets(input)
    assert.equal(result.token, '[REDACTED]')
})

test('redactSecrets redacts secret field', () => {
    const input = { apiSecret: 'mysecret', name: 'test' }
    const result = redactSecrets(input)
    assert.equal(result.apiSecret, '[REDACTED]')
})

test('redactSecrets redacts code field', () => {
    const input = { verificationCode: '123456', id: 1 }
    const result = redactSecrets(input)
    assert.equal(result.verificationCode, '[REDACTED]')
})

test('redactSecrets handles nested objects', () => {
    const input = {
        user: {
            name: 'John',
            password: 'secret',
            settings: {
                apiToken: 'token123',
            },
        },
    }
    const result = redactSecrets(input)
    assert.equal(result.user.password, '[REDACTED]')
    assert.equal(result.user.settings.apiToken, '[REDACTED]')
    assert.equal(result.user.name, 'John')
})

test('redactSecrets handles null input', () => {
    const result = redactSecrets(null)
    assert.equal(result, null)
})

test('redactSecrets handles non-object input', () => {
    const result = redactSecrets('string')
    assert.equal(result, 'string')
})

test('redactSecrets does not mutate original object', () => {
    const input = { password: 'secret' }
    redactSecrets(input)
    assert.equal(input.password, 'secret')
})

// --- errorMessage tests ---
test('errorMessage extracts message from Error instance', () => {
    const err = new Error('Something went wrong')
    assert.equal(errorMessage(err), 'Something went wrong')
})

test('errorMessage extracts message from object with message property', () => {
    const err = { message: 'Custom error message', code: 500 }
    assert.equal(errorMessage(err), 'Custom error message')
})

test('errorMessage converts unknown value to string', () => {
    assert.equal(errorMessage('string error'), 'string error')
    assert.equal(errorMessage(42), '42')
    assert.equal(errorMessage(null), 'null')
    assert.equal(errorMessage(undefined), 'undefined')
})

test('errorMessage handles object without message', () => {
    const err = { code: 500, type: 'unknown' }
    const result = errorMessage(err)
    assert.ok(result.includes('object'))
})

test('errorMessage handles array', () => {
    const err = ['error1', 'error2']
    const result = errorMessage(err)
    assert.ok(result.includes('error1'))
})
