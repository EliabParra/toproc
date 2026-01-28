import test from 'node:test'
import assert from 'node:assert/strict'

import { parseMethodsFromBO } from '../scripts/bo/templates/bo.ts'

test('bo.parseMethodsFromBO extracts async method names', () => {
    const content = `
export class PersonBO {
  async getPerson(params) { return params }
  async _helper() { return null }
  async createPerson(params) { return params }
  notAsync() { return 1 }
}
`

    const methods = parseMethodsFromBO(content).sort()
    // Implementation intentionally skips methods starting with _
    assert.deepEqual(methods, ['createPerson', 'getPerson'])
})
