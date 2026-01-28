import test from 'node:test'
import assert from 'node:assert/strict'
import { z } from 'zod'

import { AppValidator } from '../src/core/AppValidator.js'

function createValidator() {
    const i18nStub = { t: (k, params) => `${k}:${JSON.stringify(params)}` }
    return new AppValidator(i18nStub)
}

test('AppValidator.validate returns valid=true for correct data', () => {
    const v = createValidator()
    const schema = z.object({ name: z.string(), age: z.number() })
    const result = v.validate({ name: 'Alice', age: 30 }, schema)

    assert.equal(result.valid, true)
    assert.deepEqual(result.data, { name: 'Alice', age: 30 })
})

test('AppValidator.validate returns valid=false for invalid data', () => {
    const v = createValidator()
    const schema = z.object({ name: z.string(), age: z.number() })
    const result = v.validate({ name: 123, age: 'not a number' }, schema)

    assert.equal(result.valid, false)
    assert.ok(result.errors && result.errors.length > 0)
})

test('AppValidator.validate handles nested objects', () => {
    const v = createValidator()
    const schema = z.object({
        user: z.object({
            email: z.string().email(),
            profile: z.object({
                bio: z.string().optional(),
            }),
        }),
    })

    const validData = {
        user: {
            email: 'test@example.com',
            profile: { bio: 'Hello!' },
        },
    }

    const result = v.validate(validData, schema)
    assert.equal(result.valid, true)
})

test('AppValidator.validate handles arrays', () => {
    const v = createValidator()
    const schema = z.object({
        items: z.array(z.number().positive()),
    })

    assert.equal(v.validate({ items: [1, 2, 3] }, schema).valid, true)
    assert.equal(v.validate({ items: [1, -2, 3] }, schema).valid, false)
})

test('AppValidator.validate returns error paths correctly', () => {
    const v = createValidator()
    const schema = z.object({
        user: z.object({
            email: z.string().email(),
        }),
    })

    const result = v.validate({ user: { email: 'invalid' } }, schema)
    assert.equal(result.valid, false)
    assert.ok(result.errors?.some((e) => e.path === 'user.email'))
})

test('AppValidator.validate handles optional fields', () => {
    const v = createValidator()
    const schema = z.object({
        required: z.string(),
        optional: z.string().optional(),
    })

    assert.equal(v.validate({ required: 'yes' }, schema).valid, true)
    assert.equal(v.validate({ required: 'yes', optional: 'also' }, schema).valid, true)
})

test('AppValidator.validate handles default values', () => {
    const v = createValidator()
    const schema = z.object({
        name: z.string().default('Anonymous'),
    })

    const result = v.validate({}, schema)
    assert.equal(result.valid, true)
    assert.equal(result.data?.name, 'Anonymous')
})

test('AppValidator.validate handles refinements', () => {
    const v = createValidator()
    const schema = z.object({
        password: z.string().refine((val) => val.length >= 8, {
            message: 'Password must be at least 8 characters',
        }),
    })

    assert.equal(v.validate({ password: '12345678' }, schema).valid, true)
    assert.equal(v.validate({ password: '1234' }, schema).valid, false)
})

test('AppValidator.validate handles transform', () => {
    const v = createValidator()
    // In Zod, transformations happen AFTER validation
    // So email validation happens on raw input, then transforms
    const schema = z.object({
        email: z.string().trim().toLowerCase().email(),
    })

    const result = v.validate({ email: '  user@example.com  ' }, schema)
    assert.equal(result.valid, true)
    assert.equal(result.data?.email, 'user@example.com')
})

test('AppValidator.validate handles union types', () => {
    const v = createValidator()
    const schema = z.object({
        value: z.union([z.string(), z.number()]),
    })

    assert.equal(v.validate({ value: 'text' }, schema).valid, true)
    assert.equal(v.validate({ value: 123 }, schema).valid, true)
    assert.equal(v.validate({ value: true }, schema).valid, false)
})

test('AppValidator works with complex auth schema', () => {
    const v = createValidator()
    const loginSchema = z.object({
        identifier: z.string().min(1),
        password: z.string().min(8),
    })

    assert.equal(
        v.validate({ identifier: 'user@test.com', password: 'securepassword' }, loginSchema).valid,
        true
    )
    assert.equal(v.validate({ identifier: '', password: 'short' }, loginSchema).valid, false)
})
