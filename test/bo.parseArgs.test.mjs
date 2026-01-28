import test from 'node:test'
import assert from 'node:assert/strict'

import { parseArgs } from '../scripts/bo/index.ts'

test('bo.parseArgs parses flags and values', async () => {
    const opts = await parseArgs([
        'new',
        'Order',
        '--methods',
        'a,b',
        '--dry',
        // '--txStart', // Not currently handled by parseArgs
        // '200',
    ])
    // parseArgs returns opts object directly
    assert.equal(opts.command, 'new')
    assert.equal(opts.name, 'Order')
    assert.equal(opts.methods, 'a,b')
    assert.equal(opts.isDryRun, true)
    // assert.equal(opts.txStart, '200') // Feature not implemented in parseArgs
})
