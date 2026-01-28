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

export type UserBaseRow = {
    user_id: number
    user_na?: string | null
    user_em?: string | null
    email_verified_at?: string | Date | null
}

export type PasswordResetRow = {
    reset_id: number
    user_id: number
    expires_at?: string | Date | null
    used_at?: string | Date | null
    attempt_count?: number | null
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

    async getUserBaseByEmail(email: string): Promise<UserBaseRow | null> {
        const r = (await this.db.exe('security', 'getUserBaseByEmail', [email])) as {
            rows?: UserBaseRow[]
        }
        return r.rows?.[0] ?? null
    }

    async getUserBaseByUsername(username: string): Promise<UserBaseRow | null> {
        const r = (await this.db.exe('security', 'getUserBaseByUsername', [username])) as {
            rows?: UserBaseRow[]
        }
        return r.rows?.[0] ?? null
    }

    async insertUser({
        username,
        email,
        passwordHash,
    }: {
        username: string | null
        email: string | null
        passwordHash: string
    }): Promise<{ user_id: number }> {
        const r = (await this.db.exe('security', 'insertUser', [
            username,
            email,
            passwordHash,
        ])) as {
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

    async updateUserLastLogin(userId: number) {
        await this.db.exe('security', 'updateUserLastLogin', [userId])
        return true
    }

    // --- Password reset
    async insertPasswordReset({
        userId,
        tokenHash,
        sentTo,
        expiresSeconds,
        ip,
        userAgent,
    }: {
        userId: number
        tokenHash: string
        sentTo: string
        expiresSeconds: number
        ip?: string | null
        userAgent?: string | null
    }): Promise<void> {
        await this.db.exe('security', 'insertPasswordReset', [
            userId,
            tokenHash,
            sentTo,
            String(expiresSeconds),
            ip ?? null,
            userAgent ?? null,
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

    async incrementPasswordResetAttempt(resetId: number): Promise<boolean> {
        await this.db.exe('security', 'incrementPasswordResetAttempt', [resetId])
        return true
    }

    async markPasswordResetUsed(resetId: number): Promise<boolean> {
        await this.db.exe('security', 'markPasswordResetUsed', [resetId])
        return true
    }

    // --- One-time codes (email verification, password reset, etc)
    async insertOneTimeCode({
        userId,
        purpose,
        codeHash,
        expiresSeconds,
        meta,
    }: {
        userId: number
        purpose: string
        codeHash: string
        expiresSeconds: number
        meta?: Record<string, unknown>
    }): Promise<boolean> {
        await this.db.exe('security', 'insertOneTimeCode', [
            userId,
            purpose,
            codeHash,
            String(expiresSeconds),
            JSON.stringify(meta ?? {}),
        ])
        return true
    }

    async consumeOneTimeCodesForUserPurpose({
        userId,
        purpose,
    }: {
        userId: number
        purpose: string
    }) {
        await this.db.exe('security', 'consumeOneTimeCodesForUserPurpose', [userId, purpose])
        return true
    }

    async getValidOneTimeCode({
        userId,
        purpose,
        codeHash,
    }: {
        userId: number
        purpose: string
        codeHash: string
    }): Promise<OneTimeCodeRow | null> {
        const r = (await this.db.exe('security', 'getValidOneTimeCodeForPurpose', [
            userId,
            purpose,
            codeHash,
        ])) as { rows?: OneTimeCodeRow[] }
        return r.rows?.[0] ?? null
    }

    async getValidOneTimeCodeForPurposeAndTokenHash({
        purpose,
        tokenHash,
        codeHash,
    }: {
        purpose: string
        tokenHash: string
        codeHash: string
    }): Promise<OneTimeCodeRow | null> {
        const r = (await this.db.exe('security', 'getValidOneTimeCodeForPurposeAndTokenHash', [
            purpose,
            tokenHash,
            codeHash,
        ])) as { rows?: OneTimeCodeRow[] }
        return r.rows?.[0] ?? null
    }

    async getActiveOneTimeCodeForPurposeAndTokenHash({
        purpose,
        tokenHash,
    }: {
        purpose: string
        tokenHash: string
    }): Promise<OneTimeCodeRow | null> {
        const r = (await this.db.exe('security', 'getActiveOneTimeCodeForPurposeAndTokenHash', [
            purpose,
            tokenHash,
        ])) as { rows?: OneTimeCodeRow[] }
        return r.rows?.[0] ?? null
    }

    async incrementOneTimeCodeAttempt(codeId: number): Promise<boolean> {
        await this.db.exe('security', 'incrementOneTimeCodeAttempt', [codeId])
        return true
    }

    async consumeOneTimeCode(codeId: number): Promise<boolean> {
        await this.db.exe('security', 'consumeOneTimeCode', [codeId])
        return true
    }

    // --- Password
    async updateUserPassword({
        userId,
        passwordHash,
    }: {
        userId: number
        passwordHash: string
    }): Promise<boolean> {
        await this.db.exe('security', 'updateUserPassword', [userId, passwordHash])
        return true
    }
}
