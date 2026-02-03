import { BOService, IConfig, IDatabase, II18nService, IEmailService } from '../../src/core/business-objects/index.js'
import { AuthRepository, AuthMessages, Errors, Types } from './AuthModule.js'
import { createHash, randomBytes } from 'node:crypto'
import bcrypt from 'bcryptjs'

function sha256Hex(value: string): string {
    return createHash('sha256').update(value, 'utf8').digest('hex')
}

export class AuthService extends BOService implements Types.IAuthService {
    private repo: AuthRepository
    private i18n: II18nService
    private email: IEmailService

    constructor(log: any, config: IConfig, db: IDatabase, i18n: II18nService, email: IEmailService) {
        super(log, config, db)
        this.repo = new AuthRepository(db)
        this.i18n = i18n
        this.email = email
    }

    private get messages() {
        return this.i18n.use(AuthMessages)
    }

    async register(data: Types.RegisterData): Promise<Types.User> {
        this.log.info('Creating new user: ' + data.email)

        const exists = await this.repo.getUserBaseByEmail(data.email)
        if (exists) {
            throw new Errors.AuthEmailExistsError(this.messages.emailAlreadyExists, data.email)
        }

        const hash = await bcrypt.hash(data.password, 10)

        const user = await this.repo.insertUser({
            username: data.name ?? null,
            email: data.email,
            passwordHash: hash,
        })

        const sessionProfileId = Number(this.config.auth.sessionProfileId ?? 1)
        await this.repo.upsertUserProfile({
            userId: user.id,
            profileId: sessionProfileId,
        })

        if (this.config.auth.requireEmailVerification) {
            await this.sendVerificationEmail(user.id, data.email)
        }

        return this.mapUser({
            ...user,
            email: data.email,
            username: data.name ?? '',
            password_hash: hash,
            email_verified_at: null,
            is_active: true,
            profile_id: sessionProfileId,
        })
    }

    async requestEmailVerification(identifier: string): Promise<void> {
        let user: Types.UserRow | null = null
        if (identifier.includes('@')) {
            user = await this.repo.getUserByEmail(identifier)
        } else {
            user = await this.repo.getUserByUsername(identifier)
        }

        if (user && user.email) {
            await this.sendVerificationEmail(user.id, user.email)
        }
    }

    async verifyEmail(token: string): Promise<void> {
        const purpose = String(this.config.auth.emailVerificationPurpose ?? 'email_verification')
        const tokenHash = sha256Hex(token)

        const otp = await this.repo.getActiveOneTimeCodeForPurposeAndTokenHash({
            purpose,
            tokenHash,
        })

        if (!otp) throw new Errors.AuthTokenInvalidError(this.messages.tokenInvalid)

        await this.repo.setUserEmailVerified(otp.user_id)
        await this.repo.consumeOneTimeCode(otp.id)
    }

    async requestPasswordReset(email: string): Promise<void> {
        const user = await this.repo.getUserByEmail(email)
        if (!user || !user.email) return

        const purpose = String(this.config.auth.passwordResetPurpose ?? 'password_reset')
        const expiresSeconds = 900

        await this.repo.invalidateActivePasswordResetsForUser(user.id)

        const token = randomBytes(32).toString('hex')
        const tokenHash = sha256Hex(token)

        await this.repo.insertPasswordReset({
            userId: user.id,
            tokenHash,
            sentTo: user.email,
            expiresSeconds,
        })

        await this.email.sendTemplate({
            to: user.email,
            subject: `${this.config.app.name}: Password Reset`,
            templatePath: 'auth/password-reset.html',
            data: {
                appName: this.config.app.name,
                code: '000000', // Placeholder as per original
                token,
            },
        })
    }

    async resetPassword(token: string, newPassword: string): Promise<void> {
        const tokenHash = sha256Hex(token)
        const reset = await this.repo.getPasswordResetByTokenHash(tokenHash)

        if (!reset || reset.used_at) throw new Errors.AuthTokenInvalidError(this.messages.tokenInvalid)

        const hash = await bcrypt.hash(newPassword, 10)
        await this.repo.updateUserPassword({ userId: reset.user_id, passwordHash: hash })
        await this.repo.markPasswordResetUsed(reset.id)
    }

    async verifyPasswordResetToken(token: string): Promise<void> {
        const tokenHash = sha256Hex(token)
        const reset = await this.repo.getPasswordResetByTokenHash(tokenHash)
        if (!reset || reset.used_at) throw new Errors.AuthTokenInvalidError(this.messages.tokenInvalid)
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

        await this.email.sendTemplate({
            to: emailAddr,
            subject: `${this.config.app.name}: Verify your email`,
            templatePath: 'auth/email-verification.html',
            data: {
                appName: this.config.app.name,
                code: '000000', // Placeholder
                token,
            },
        })
    }

    private mapUser(row: Types.UserRow): Types.User {
        return {
            userId: row.id,
            email: row.email!,
            name: row.username ?? undefined,
            passwordHash: row.password_hash ?? '',
            isEmailVerified: !!row.email_verified_at,
            isActive: !!row.is_active,
            createdAt: new Date(),
        }
    }
}
