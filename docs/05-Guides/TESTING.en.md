# Testing Guide: Native Tests

We use the native **Node.js Test Runner** (`node:test`). It's fast, simple, and doesn't require installing Jest or Mocha.

## Test Structure

Create a file `BO/Coupons/test/CouponsService.test.ts`.

```typescript
import { describe, it, before, mock } from 'node:test' // Native!
import assert from 'node:assert/strict'

import { CouponsService } from '../CouponsService'

describe('Coupons Logic', () => {
    let service: CouponsService
    let mockRepo: any

    before(() => {
        // 1. Create Mock (Simulation) of Repository
        // We don't want to touch real DB
        mockRepo = {
            findByCode: mock.fn(),
            create: mock.fn(),
        }

        const mockLog = { info: () => {} }
        const mockConfig = {}
        const mockDb = {}

        service = new CouponsService(mockRepo, mockLog as any, mockConfig as any, mockDb as any)
    })

    it('should reject duplicate coupons', async () => {
        // Simulate findByCode returning something (exists)
        mockRepo.findByCode.mock.mockImplementation(() => Promise.resolve({ id: 1 }))

        await assert.rejects(async () => await service.create({ code: 'TEST' }), {
            message: 'Coupon already exists',
        })
    })

    it('should create if not exists', async () => {
        // Simulate not existing (null)
        mockRepo.findByCode.mock.mockImplementation(() => Promise.resolve(null))
        mockRepo.create.mock.mockImplementation(() => Promise.resolve({ id: 99 }))

        const res = await service.create({ code: 'NEW' })
        assert.equal(res.id, 99)
    })
})
```

## Commands

- **All tests**: `pnpm test`
- **Single file**: `node --import tsx --test BO/Coupons/test/CouponsService.test.ts`
- **With Coverage**: `pnpm run test:coverage` (tells you % of code tested).
