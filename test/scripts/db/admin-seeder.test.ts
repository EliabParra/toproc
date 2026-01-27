import { describe, it } from 'node:test'
import assert from 'node:assert'
import { AdminSeeder } from '../../../scripts/db/seeders/admin.js'

// Mock Database with tracking
const createMockDb = () => {
    const calls: Array<{ sql: string; params: any[] }> = []
    return {
        calls,
        exeRaw: async (sql: string, params?: any[]) => {
            calls.push({ sql, params: params || [] })
            if (sql.includes('INSERT INTO security.profiles')) {
                return { rows: [], rowCount: 1 }
            }
            if (sql.includes('INSERT INTO security.users')) {
                return { rows: [{ user_id: 42 }], rowCount: 1 }
            }
            if (sql.includes('INSERT INTO security.user_profiles')) {
                return { rows: [], rowCount: 1 }
            }
            return { rows: [], rowCount: 0 }
        },
    }
}

describe('AdminSeeder', () => {
    it('should seed admin user with hashed password', async () => {
        const mockDb = createMockDb()
        const seeder = new AdminSeeder(mockDb as any)

        const result = await seeder.seed({
            username: 'admin',
            password: 'secret123',
            profileId: 1,
        })

        assert.strictEqual(result.userId, 42)
        assert.strictEqual(result.profileId, 1)

        // Verify profile was created
        const profileCall = mockDb.calls.find((c) =>
            c.sql.includes('INSERT INTO security.profiles')
        )
        assert.ok(profileCall, 'Profile insert call should exist')

        // Verify user was created with hashed password (not plain text)
        const userCall = mockDb.calls.find((c) => c.sql.includes('INSERT INTO security.users'))
        assert.ok(userCall, 'User insert call should exist')
        const passwordParam = userCall.params[1]
        assert.ok(
            passwordParam.startsWith('$2b$') || passwordParam.startsWith('$2a$'),
            'Password should be bcrypt hashed'
        )
    })

    it('should generate random password of specified length', () => {
        const password = AdminSeeder.generatePassword(20)
        assert.strictEqual(password.length, 20)

        // Should be unique
        const password2 = AdminSeeder.generatePassword(20)
        assert.notStrictEqual(password, password2)
    })
})
