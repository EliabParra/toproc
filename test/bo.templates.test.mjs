import test from 'node:test'
import assert from 'node:assert/strict'

import { templateBO } from '../scripts/bo.ts'

test('bo.templateBO generates new architecture', () => {
    const out = templateBO('Order', ['getOrder'])
    assert.match(out, /extends BaseBO/)
    assert.match(out, /import { OrderSchemas } from '\.\/schemas\.js'/)
    assert.match(out, /this\.validate<z\.infer<typeof OrderSchemas\.getOrder>>/)
})
