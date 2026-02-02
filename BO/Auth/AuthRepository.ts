/*
Auth Repository

- DB access helpers used by AuthBO.
- Uses AuthQueries from ./AuthQueries.ts
*/

import { IDatabase } from '../../src/types/core.js'
import { AuthQueries } from './AuthQueries.js'
import {
    OneTimeCodeRow,
    PasswordResetRow,
    UserRow,
    UserId,
    UserWithProfileId,
    PasswordReset,
    OneTimeCode,
    InsertUserParams,
    GetActiveOneTimeCodeParams,
    UserPasswordResetParams,
} from './AuthTypes.js'

export class AuthRepository {
    constructor(private db: IDatabase) {}

    // --- Users
    async getUserByEmail(email: string): Promise<UserRow | null> {
        const r = await this.db.query<UserRow>(AuthQueries.getUserByEmail, [email])
        return r.rows[0]
    }

    async getUserByUsername(username: string): Promise<UserRow | null> {
        const r = await this.db.query<UserRow>(AuthQueries.getUserByUsername, [username])
        return r.rows[0]
    }

    async getUserBaseByEmail(email: string): Promise<UserRow | null> {
        const r = await this.db.query<UserRow>(AuthQueries.getUserBaseByEmail, [email])
        return r.rows[0]
    }

    async insertUser(params: InsertUserParams): Promise<UserId> {
        const r = await this.db.query<UserId>(AuthQueries.insertUser, [
            params.username,
            params.email,
            params.passwordHash,
        ])
        const row = r.rows[0]
        if (!row.id) throw new Error('insertUser did not return id')
        return row
    }

    async upsertUserProfile(params: UserWithProfileId) {
        await this.db.query<UserId>(AuthQueries.upsertUserProfile, [
            params.userId,
            params.profileId,
        ])
        return true
    }

    async setUserEmailVerified(userId: number) {
        await this.db.query<UserId>(AuthQueries.setUserEmailVerified, [userId])
        return true
    }

    // --- Password reset
    async insertPasswordReset(params: PasswordReset): Promise<void> {
        await this.db.query<UserId>(AuthQueries.insertPasswordReset, [
            params.userId,
            params.tokenHash,
            String(params.expiresSeconds),
            params.sentTo,
            null, // ip
            null, // userAgent
        ])
    }

    async invalidateActivePasswordResetsForUser(userId: number): Promise<boolean> {
        await this.db.query<UserId>(AuthQueries.invalidateActivePasswordResetsForUser, [userId])
        return true
    }

    async getPasswordResetByTokenHash(tokenHash: string): Promise<PasswordResetRow | null> {
        const r = await this.db.query<PasswordResetRow>(AuthQueries.getPasswordResetByTokenHash, [
            tokenHash,
        ])
        return r.rows[0]
    }

    async markPasswordResetUsed(resetId: number): Promise<boolean> {
        await this.db.query<UserId>(AuthQueries.markPasswordResetUsed, [resetId])
        return true
    }

    // --- One-time codes
    async insertOneTimeCode(params: OneTimeCode): Promise<boolean> {
        await this.db.query<UserId>(AuthQueries.insertOneTimeCode, [
            params.userId,
            params.purpose,
            params.codeHash,
            String(params.expiresSeconds),
            JSON.stringify(params.meta ?? {}),
        ])
        return true
    }

    async consumeOneTimeCode(codeId: number): Promise<boolean> {
        await this.db.query<UserId>(AuthQueries.consumeOneTimeCode, [codeId])
        return true
    }

    async getActiveOneTimeCodeForPurposeAndTokenHash(
        params: GetActiveOneTimeCodeParams
    ): Promise<OneTimeCodeRow | null> {
        const r = await this.db.query<OneTimeCodeRow>(
            AuthQueries.getActiveOneTimeCodeForPurposeAndTokenHash,
            [params.purpose, params.tokenHash]
        )
        return r.rows[0]
    }

    async updateUserPassword(params: UserPasswordResetParams): Promise<boolean> {
        await this.db.query<UserId>(AuthQueries.updateUserPassword, [
            params.userId,
            params.passwordHash,
        ])
        return true
    }
}
