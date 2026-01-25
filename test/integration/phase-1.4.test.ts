import { test } from 'node:test'
import assert from 'node:assert/strict'
import '../../src/globals.js'

test('Phase 1.4 Integration', async (t) => {
    await t.test('Feature Flags are loaded', () => {
        const features = (globalThis as any).features
        assert.ok(features, 'g.features should exist')
        assert.ok(typeof features.isEnabled === 'function')

        // Check default
        assert.equal(
            features.isEnabled('USE_NEW_VALIDATOR'),
            true,
            'New Validator should be enabled by default'
        )
    })

    await t.test('Legacy Validator Adapter is active', () => {
        const v = (globalThis as any).v
        assert.ok(v, 'g.v should exist')

        console.log('DEBUG: g.v.constructor.name =', v.constructor.name)

        // Verify it delegates to AppValidator properly
        // Valid case
        const valid = v.validate('test@example.com', 'email')
        console.log('DEBUG: validate(email) result =', valid)
        assert.equal(valid, true, 'Email validation should pass')
        assert.equal(v.getAlerts().length, 0)

        // Invalid case (should use Zod message translated)
        const invalid = v.validate('not-an-email', 'email')
        console.log('DEBUG: validate(invalid) result =', invalid)
        assert.equal(invalid, false, 'Invalid email should fail')
        const alerts = v.getAlerts()
        console.log('DEBUG: Alerts =', alerts)
        assert.ok(alerts.length > 0, 'Should have alerts')

        // Check if message looks translated
        const msg = alerts[0] || ''
        console.log('DEBUG: First Alert =', msg)
    })

    await t.test('Batch Validation', () => {
        const v = (globalThis as any).v
        console.log('DEBUG: Testing validateAll...')
        const res = v.validateAll(['text', 123], ['string', 'int'])
        console.log('DEBUG: validateAll valid case =', res)
        assert.equal(res, true)

        const res2 = v.validateAll(['text', 'not-int'], ['string', 'int'])
        console.log('DEBUG: validateAll invalid case =', res2)
        assert.equal(res2, false)
        assert.ok(v.getAlerts().length > 0)
    })
})
