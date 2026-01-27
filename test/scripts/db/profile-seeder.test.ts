import { describe, it, mock } from 'node:test'
import assert from 'node:assert'
import { ProfileSeeder } from '../../../scripts/db/seeders/profiles.js'

// Mock Database
const createMockDb = () => ({
    exeRaw: mock.fn(async (sql: string, params?: any[]) => {
        return { rows: [{ profile_id: params?.[0] }], rowCount: 1 }
    }),
})

describe('ProfileSeeder', () => {
    it('should seed public and session profiles', async () => {
        const mockDb = createMockDb()
        const seeder = new ProfileSeeder(mockDb as any)

        const result = await seeder.seed({
            publicProfileId: 2,
            sessionProfileId: 1,
        })

        assert.strictEqual(result.created, 2)

        // Verify both profiles were created
        assert.strictEqual(mockDb.exeRaw.mock.calls.length, 2)
    })

    it('should seed admin profile when provided', async () => {
        const mockDb = createMockDb()
        const seeder = new ProfileSeeder(mockDb as any)

        const result = await seeder.seed({
            publicProfileId: 2,
            sessionProfileId: 1,
            adminProfileId: 99,
        })

        assert.strictEqual(result.created, 3)
    })

    it('should grant permissions to profile', async () => {
        const mockDb = createMockDb()
        const seeder = new ProfileSeeder(mockDb as any)

        const granted = await seeder.grantPermissions(1, [10, 20, 30])

        assert.strictEqual(granted, 3)
    })
})
