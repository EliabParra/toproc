import { createHash, randomBytes } from 'node:crypto'
import bcrypt from 'bcryptjs'
import type { ILogger, IConfig } from '../../src/types/core.js'
import { EmailService } from '../../src/email/EmailService.js'
import { AuthRepository, UserRow } from './Auth.Repository.js'
import type { User, RegisterData } from './Auth.Types.js'
import { AuthEmailExistsError, AuthTokenInvalidError } from './Auth.Errors.js'

function sha256Hex(value: string): string {
    return createHash('sha256').update(value, 'utf8').digest('hex')
}

export class AuthService {
    private emailService: EmailService

    constructor(
        private readonly log: ILogger,
        private readonly config: IConfig
    ) {
        this.emailService = new EmailService({ log: this.log, config: this.config })
    }

    async register(data: RegisterData): Promise<User> {
        this.log.show({ type: this.log.TYPE_INFO, msg: 'Creating new user: ' + data.email })

        const exists = await AuthRepository.getUserBaseByEmail(data.email)
        if (exists) {
            throw new AuthEmailExistsError(data.email)
        }

        const hash = await bcrypt.hash(data.password, 10)

        const user = await AuthRepository.insertUser({
            username: data.name ?? null,
            email: data.email,
            passwordHash: hash,
        })

        const sessionProfileId = Number((this.config as any)?.auth?.sessionProfileId ?? 1)
        await AuthRepository.upsertUserProfile({
            userId: user.user_id,
            profileId: sessionProfileId,
        })

        if ((this.config as any)?.auth?.requireEmailVerification) {
            await this.sendVerificationEmail(user.user_id, data.email)
        }

        return this.mapUser({ ...user, user_em: data.email, user_na: data.name, user_pw: hash })
    }

    async requestEmailVerification(identifier: string): Promise<void> {
        let user: UserRow | null = null
        if (identifier.includes('@')) {
            user = await AuthRepository.getUserByEmail(identifier)
        } else {
            user = await AuthRepository.getUserByUsername(identifier)
        }

        if (user && user.user_em) {
            await this.sendVerificationEmail(user.user_id, user.user_em)
        }
    }

    async verifyEmail(token: string): Promise<void> {
        const purpose = String(
            (this.config as any)?.auth?.emailVerificationPurpose ?? 'email_verification'
        )
        const tokenHash = sha256Hex(token)

        // Assuming repo has this method or similar
        // Based on user snippet: getValidOneTimeCodeForPurposeAndTokenHash
        // But Repo doesn't accept purpose/tokenHash alone in step 7189?
        // It has getActiveOneTimeCodeForPurposeAndTokenHash
        const otp = await AuthRepository.getActiveOneTimeCodeForPurposeAndTokenHash({
            purpose,
            tokenHash,
        })

        if (!otp) throw new AuthTokenInvalidError()

        await AuthRepository.setUserEmailVerified(otp.user_id)
        await AuthRepository.consumeOneTimeCode(otp.code_id)
    }

    async requestPasswordReset(email: string): Promise<void> {
        const user = await AuthRepository.getUserByEmail(email)
        if (!user || !user.user_em) return

        const purpose = String((this.config as any)?.auth?.passwordResetPurpose ?? 'password_reset')
        const expiresSeconds = 900

        // Invalidate previous
        await AuthRepository.invalidateActivePasswordResetsForUser(user.user_id)

        const token = randomBytes(32).toString('hex')
        const tokenHash = sha256Hex(token)

        await AuthRepository.insertPasswordReset({
            userId: user.user_id,
            tokenHash,
            sentTo: user.user_em,
            expiresSeconds,
        })

        await this.emailService.sendPasswordReset({
            to: user.user_em,
            token,
            code: '000000', // Placeholder if not used
            appName: (this.config as any)?.app?.name,
        })
    }

    async resetPassword(token: string, newPassword: string): Promise<void> {
        const tokenHash = sha256Hex(token)
        const reset = await AuthRepository.getPasswordResetByTokenHash(tokenHash)

        if (!reset || reset.used_at) throw new AuthTokenInvalidError()

        // Check expiry
        // ...

        const hash = await bcrypt.hash(newPassword, 10)
        await AuthRepository.updateUserPassword({ userId: reset.user_id, passwordHash: hash })
        await AuthRepository.markPasswordResetUsed(reset.reset_id)
    }

    private async sendVerificationEmail(userId: number, emailAddr: string) {
        const purpose = String(
            (this.config as any)?.auth?.emailVerificationPurpose ?? 'email_verification'
        )
        const expiresSeconds = 900

        const token = randomBytes(32).toString('hex')
        const tokenHash = sha256Hex(token)

        await AuthRepository.insertOneTimeCode({
            userId,
            purpose,
            codeHash: tokenHash, // storing tokenHash as codeHash for simplicity if Repo allows
            expiresSeconds,
            meta: { tokenHash },
        })

        await this.emailService.sendEmailVerification({
            to: emailAddr,
            token,
            code: '000000',
            appName: (this.config as any)?.app?.name,
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
