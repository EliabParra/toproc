import { Database } from '../core/db.js'
import colors from 'colors'

export interface ProfileSeedOptions {
    publicProfileId: number
    sessionProfileId: number
    adminProfileId?: number
}

/**
 * Seeds default profiles (public, session, admin).
 */
export class ProfileSeeder {
    constructor(private db: Database) {}

    /**
     * Creates profiles if they don't exist.
     */
    async seed(options: ProfileSeedOptions): Promise<{ created: number }> {
        const { publicProfileId, sessionProfileId, adminProfileId } = options

        console.log(`\n🏷️  Seeding profiles...`.cyan)

        let created = 0

        // Public profile (for anonymous/unauthenticated users)
        if (publicProfileId) {
            const r = await this.db.exeRaw(
                `INSERT INTO security.profiles (id, name) 
                 VALUES ($1, 'public') 
                 ON CONFLICT (id) DO UPDATE SET name = COALESCE(security.profiles.name, 'public')
                 RETURNING id`,
                [publicProfileId]
            )
            if (r.rowCount && r.rowCount > 0) created++
            console.log(`   ✅ Public profile (id=${publicProfileId})`.green)
        }

        // Session profile (for logged-in users)
        if (sessionProfileId) {
            const r = await this.db.exeRaw(
                `INSERT INTO security.profiles (id, name) 
                 VALUES ($1, 'session') 
                 ON CONFLICT (id) DO UPDATE SET name = COALESCE(security.profiles.name, 'session')
                 RETURNING id`,
                [sessionProfileId]
            )
            if (r.rowCount && r.rowCount > 0) created++
            console.log(`   ✅ Session profile (id=${sessionProfileId})`.green)
        }

        // Admin profile (optional, for super users)
        if (adminProfileId) {
            const r = await this.db.exeRaw(
                `INSERT INTO security.profiles (id, name) 
                 VALUES ($1, 'admin') 
                 ON CONFLICT (id) DO UPDATE SET name = COALESCE(security.profiles.name, 'admin')
                 RETURNING id`,
                [adminProfileId]
            )
            if (r.rowCount && r.rowCount > 0) created++
            console.log(`   ✅ Admin profile (id=${adminProfileId})`.green)
        }

        console.log(`   📊 Profiles seeded: ${created}`.gray)
        return { created }
    }

    /**
     * Grants permissions to a profile for specific methods.
     */
    async grantPermissions(profileId: number, methodIds: number[]): Promise<number> {
        let granted = 0
        for (const methodId of methodIds) {
            try {
                await this.db.exeRaw(
                    `INSERT INTO security.permission_methods (profile_id, method_id) 
                     VALUES ($1, $2) ON CONFLICT DO NOTHING`,
                    [profileId, methodId]
                )
                granted++
            } catch (e) {
                // Ignore if already exists
            }
        }
        return granted
    }
}
