/*
Auth Repository

- DB access helpers used by AuthBO.
- Must align with query names in src/config/queries.json.
*/

import { IDatabase } from '../../src/types/core.js'

export type UserRow = {
    user_id: number
    user_na?: string | null
    user_em?: string | null
    email_verified_at?: string | Date | null
    user_pw?: string | null
    profile_id?: number | null
}

export type OneTimeCodeRow = {
    code_id: number
    user_id: number
    purpose?: string | null
    expires_at?: string | Date | null
    consumed_at?: string | Date | null
    attempt_count?: number | null
    meta?: any
}

export type PasswordResetRow = {
    reset_id: number
    user_id: number
    expires_at?: string | Date | null
    used_at?: string | Date | null
    attempt_count?: number | null
}

export class AuthRepository {
    constructor(private db: IDatabase) {}

    // --- Users
    async getUserByEmail(email: string): Promise<UserRow | null> {
        const r = (await this.db.exe('security', 'getUserByEmail', [email])) as { rows?: UserRow[] }
        return r.rows?.[0] ?? null
    }

    async getUserByUsername(username: string): Promise<UserRow | null> {
        const r = (await this.db.exe('security', 'getUserByUsername', [username])) as {
            rows?: UserRow[]
        }
        return r.rows?.[0] ?? null
    }

    async getUserBaseByEmail(email: string): Promise<UserRow | null> {
        const r = (await this.db.exe('security', 'getUserBaseByEmail', [email])) as {
            rows?: UserRow[]
        }
        return r.rows?.[0] ?? null
    }

    async insertUser(params: {
        username: string | null
        email: string | null
        passwordHash: string
    }): Promise<{ user_id: number }> {
        const r = (await this.db.exe('security', 'insertUser', [params.username, params.email, params.passwordHash])) as {
            rows?: Array<{ user_id: number }>
        }
        const row = r.rows?.[0]
        if (!row?.user_id) throw new Error('insertUser did not return user_id')
        return row
    }

    async upsertUserProfile({ userId, profileId }: { userId: number; profileId: number }) {
        await this.db.exe('security', 'upsertUserProfile', [userId, profileId])
        return true
    }

    async setUserEmailVerified(userId: number) {
        await this.db.exe('security', 'setUserEmailVerified', [userId])
        return true
    }

    // --- Password reset
    async insertPasswordReset(params: {
        userId: number
        tokenHash: string
        sentTo: string
        expiresSeconds: number
    }): Promise<void> {
        await this.db.exe('security', 'insertPasswordReset', [
            params.userId,
            params.tokenHash,
            params.sentTo,
            String(params.expiresSeconds),
            null, // ip
            null, // userAgent
        ])
    }

    async invalidateActivePasswordResetsForUser(userId: number): Promise<boolean> {
        await this.db.exe('security', 'invalidateActivePasswordResetsForUser', [userId])
        return true
    }

    async getPasswordResetByTokenHash(tokenHash: string): Promise<PasswordResetRow | null> {
        const r = (await this.db.exe('security', 'getPasswordResetByTokenHash', [tokenHash])) as {
            rows?: PasswordResetRow[]
        }
        return r.rows?.[0] ?? null
    }

    async markPasswordResetUsed(resetId: number): Promise<boolean> {
        await this.db.exe('security', 'markPasswordResetUsed', [resetId])
        return true
    }

    // --- One-time codes
    async insertOneTimeCode(params: {
        userId: number
        purpose: string
        codeHash: string
        expiresSeconds: number
        meta?: any
    }): Promise<boolean> {
        await this.db.exe('security', 'insertOneTimeCode', [
            params.userId,
            params.purpose,
            params.codeHash,
            String(params.expiresSeconds),
            JSON.stringify(params.meta ?? {}),
        ])
        return true
    }

    async consumeOneTimeCode(codeId: number): Promise<boolean> {
        await this.db.exe('security', 'consumeOneTimeCode', [codeId])
        return true
    }

    async getActiveOneTimeCodeForPurposeAndTokenHash(params: {
        purpose: string
        tokenHash: string
    }): Promise<OneTimeCodeRow | null> {
        const r = (await this.db.exe('security', 'getActiveOneTimeCodeForPurposeAndTokenHash', [
            params.purpose,
            params.tokenHash,
        ])) as { rows?: OneTimeCodeRow[] }
        return r.rows?.[0] ?? null
    }

    async updateUserPassword(params: { userId: number; passwordHash: string }): Promise<boolean> {
        await this.db.exe('security', 'updateUserPassword', [params.userId, params.passwordHash])
        return true
    }
}
