import { Database } from '../core/db.js'
import bcrypt from 'bcrypt'
import colors from 'colors'

export interface AdminSeedOptions {
    username: string
    password: string
    profileId: number
}

/**
 * Seeds an admin user with a hashed password.
 */
export class AdminSeeder {
    constructor(private db: Database) {}

    /**
     * Creates or updates an admin user and links to profile.
     */
    async seed(options: AdminSeedOptions): Promise<{ userId: number; profileId: number }> {
        const { username, password, profileId } = options

        console.log(`\n👤 Seeding admin user: ${username}`.cyan)

        // Hash password
        const saltRounds = 10
        const passwordHash = await bcrypt.hash(password, saltRounds)

        // Ensure profile exists
        await this.db.exeRaw(
            "INSERT INTO security.profiles (id, name) VALUES ($1, 'admin') ON CONFLICT (id) DO NOTHING",
            [profileId]
        )

        // Upsert user
        const result = await this.db.exeRaw(
            `INSERT INTO security.users (username, password_hash, profile_id) 
             VALUES ($1, $2, $3) 
             ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash 
             RETURNING id as user_id`,
            [username, passwordHash, profileId]
        )
        const userId = result.rows[0]?.user_id

        if (!userId) throw new Error('Failed to create admin user')

        // Link user to profile
        await this.db.exeRaw(
            `INSERT INTO security.user_profiles (user_id, profile_id) 
             VALUES ($1, $2) 
             ON CONFLICT (user_id, profile_id) DO NOTHING`,
            [userId, profileId]
        )

        console.log(
            `   ✅ Admin user created/updated (user_id=${userId}, profile_id=${profileId})`.green
        )

        return { userId, profileId }
    }

    /**
     * Generates a random secure password.
     */
    static generatePassword(length = 16): string {
        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()'
        let password = ''
        for (let i = 0; i < length; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length))
        }
        return password
    }
}
