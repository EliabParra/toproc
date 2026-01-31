import { createHash, randomBytes } from 'node:crypto'
import bcrypt from 'bcryptjs'
import { BOService } from '../../src/core/business-objects/BOService.js'
import type { IConfig, IDatabase } from '../../src/types/core.js'
import { EmailService } from '../../src/services/EmailService.js'
import { AuthRepository } from './Auth.Repository.js'
import { UserRow } from './Auth.Types.js'
import type { User, RegisterData } from './Auth.Types.js'
import { AuthEmailExistsError, AuthTokenInvalidError } from './Auth.Errors.js'

function sha256Hex(value: string): string {
    return createHash('sha256').update(value, 'utf8').digest('hex')
}

export class AuthService extends BOService {
    private emailService: EmailService
    private repo: AuthRepository

    constructor(log: any, config: IConfig, db: IDatabase) {
        super(log, config, db)
        this.emailService = new EmailService({ log: this.log, config: this.config })
        this.repo = new AuthRepository(db)
    }

    async register(data: RegisterData): Promise<User> {
        this.log.show({ type: this.log.TYPE_INFO, msg: 'Creating new user: ' + data.email })

        const exists = await this.repo.getUserBaseByEmail(data.email)
        if (exists) {
            throw new AuthEmailExistsError(data.email)
        }

        const hash = await bcrypt.hash(data.password, 10)

        const user = await this.repo.insertUser({
            username: data.name ?? null,
            email: data.email,
            passwordHash: hash,
        })

        const sessionProfileId = Number(this.config.auth.sessionProfileId ?? 1)
        await this.repo.upsertUserProfile({
            userId: user.user_id,
            profileId: sessionProfileId,
        })

        if (this.config.auth.requireEmailVerification) {
            await this.sendVerificationEmail(user.user_id, data.email)
        }

        return this.mapUser({ ...user, user_em: data.email, user_na: data.name, user_pw: hash })
    }

    async requestEmailVerification(identifier: string): Promise<void> {
        let user: UserRow | null = null
        if (identifier.includes('@')) {
            user = await this.repo.getUserByEmail(identifier)
        } else {
            user = await this.repo.getUserByUsername(identifier)
        }

        if (user && user.user_em) {
            await this.sendVerificationEmail(user.user_id, user.user_em)
        }
    }

    async verifyEmail(token: string): Promise<void> {
        const purpose = String(this.config.auth.emailVerificationPurpose ?? 'email_verification')
        const tokenHash = sha256Hex(token)

        const otp = await this.repo.getActiveOneTimeCodeForPurposeAndTokenHash({
            purpose,
            tokenHash,
        })

        if (!otp) throw new AuthTokenInvalidError()

        await this.repo.setUserEmailVerified(otp.user_id)
        await this.repo.consumeOneTimeCode(otp.code_id)
    }

    async requestPasswordReset(email: string): Promise<void> {
        const user = await this.repo.getUserByEmail(email)
        if (!user || !user.user_em) return

        const purpose = String(this.config.auth.passwordResetPurpose ?? 'password_reset')
        const expiresSeconds = 900

        await this.repo.invalidateActivePasswordResetsForUser(user.user_id)

        const token = randomBytes(32).toString('hex')
        const tokenHash = sha256Hex(token)

        await this.repo.insertPasswordReset({
            userId: user.user_id,
            tokenHash,
            sentTo: user.user_em,
            expiresSeconds,
        })

        await this.emailService.sendPasswordReset({
            to: user.user_em,
            token,
            code: '000000',
            appName: this.config.app.name,
        })
    }

    async resetPassword(token: string, newPassword: string): Promise<void> {
        const tokenHash = sha256Hex(token)
        const reset = await this.repo.getPasswordResetByTokenHash(tokenHash)

        if (!reset || reset.used_at) throw new AuthTokenInvalidError()

        const hash = await bcrypt.hash(newPassword, 10)
        await this.repo.updateUserPassword({ userId: reset.user_id, passwordHash: hash })
        await this.repo.markPasswordResetUsed(reset.reset_id)
    }

    async verifyPasswordResetToken(token: string): Promise<void> {
        const tokenHash = sha256Hex(token)
        const reset = await this.repo.getPasswordResetByTokenHash(tokenHash)
        if (!reset || reset.used_at) throw new AuthTokenInvalidError()
    }

    private async sendVerificationEmail(userId: number, emailAddr: string) {
        const purpose = String(this.config.auth.emailVerificationPurpose ?? 'email_verification')
        const expiresSeconds = 900

        const token = randomBytes(32).toString('hex')
        const tokenHash = sha256Hex(token)

        await this.repo.insertOneTimeCode({
            userId,
            purpose,
            codeHash: tokenHash,
            expiresSeconds,
            meta: { tokenHash },
        })

        await this.emailService.sendEmailVerification({
            to: emailAddr,
            token,
            code: '000000',
            appName: this.config.app.name,
        })
    }

    private mapUser(row: UserRow): User {
        return {
            userId: row.user_id,
            email: row.user_em!,
            name: row.user_na ?? undefined,
            passwordHash: row.user_pw ?? '',
            isEmailVerified: !!row.email_verified_at,
            isActive: true,
            createdAt: new Date(),
        }
    }
}
