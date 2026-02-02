import test from 'node:test'
import assert from 'node:assert/strict'
import { BaseBO } from '../../src/core/business-objects/BaseBO.js'
import { z } from 'zod'

// Mock dependencies
const mockDeps = {
    db: {},
    log: {
        info: () => {},
        error: () => {},
    },
    config: {},
    validator: {
        validate: (data, schema) => {
            const result = schema.safeParse(data)
            if (result.success) return { valid: true, data: result.data }
            return {
                valid: false,
                errors: result.error.issues.map((issue) => ({
                    path: issue.path.join('.'),
                    message: issue.message,
                    code: issue.code,
                })),
            }
        },
    },
    i18n: {
        translate: (key) => key,
        format: (key) => key,
    },
}

class TestBO extends BaseBO {
    constructor() {
        super(mockDeps)
    }

    async testValidation(data) {
        const schema = z.object({
            email: z.string().email('Invalid email'),
            age: z.number().min(18, 'Too young'),
        })

        // This implicitly calls this.validate() -> this.validationError()
        return this.exec(data, schema, async (d) => {
            return this.success(d)
        })
    }
}

test('BaseBO returns structured validation errors', async () => {
    const bo = new TestBO()

    // Invalid data
    const response = await bo.testValidation({ email: 'bad-email', age: 10 })

    // Verify HTTP Code
    assert.equal(response.code, 400)
    assert.equal(response.msg, 'Validation Error')

    // Verify Legacy Alerts (Backward Compatibility)
    assert.ok(Array.isArray(response.alerts))
    assert.ok(response.alerts.includes('Invalid email'))
    assert.ok(response.alerts.includes('Too young'))

    // Verify New Structured Errors
    assert.ok(Array.isArray(response.errors))
    assert.equal(response.errors.length, 2)

    const emailError = response.errors.find((e) => e.path === 'email')
    assert.ok(emailError)
    assert.equal(emailError.message, 'Invalid email')

    const ageError = response.errors.find((e) => e.path === 'age')
    assert.ok(ageError)
    assert.equal(ageError.message, 'Too young')
})

test('BaseBO returns success on valid data', async () => {
    const bo = new TestBO()
    const response = await bo.testValidation({ email: 'test@example.com', age: 20 })

    assert.equal(response.code, 200)
    assert.equal(response.data.email, 'test@example.com')
    assert.equal(response.errors, undefined)
})
