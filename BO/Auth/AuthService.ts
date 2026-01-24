import bcrypt from 'bcryptjs'
import { createHash, randomBytes } from 'node:crypto'
import { IEmailService, ILogger } from '../../src/core/interfaces/services.js'
import { AuthRepository } from './AuthRepository.js'
import { RegisterParams } from './AuthTypes.js'

type AuthConfig = {
    auth?: {
        loginId?: string
        requireEmailVerification?: boolean
        sessionProfileId?: number
        emailVerificationPurpose?: string
        emailVerificationExpiresSeconds?: number
        emailVerificationMaxAttempts?: number
        passwordResetExpiresSeconds?: number
        passwordResetMaxAttempts?: number
        passwordResetPurpose?: string
    }
    app?: {
        name?: string
    }
    session?: {
        store?: {
            schemaName?: string
            tableName?: string
        }
    }
}

export class AuthService {
    constructor(
        private readonly repo: AuthRepository,
        private readonly email: IEmailService,
        private readonly config: AuthConfig,
        private readonly log: ILogger
    ) {}

    private sha256Hex(value: string): string {
        return createHash('sha256').update(value, 'utf8').digest('hex')
    }

    async register(params: RegisterParams): Promise<{ success: boolean; error?: string }> {
        const username = typeof params.username === 'string' ? params.username : undefined
        const emailValue = typeof params.email === 'string' ? params.email : undefined
        const password = typeof params.password === 'string' ? params.password : undefined

        // Note: Validation is done in BO layer (Controller)

        // Duplicate checks
        if (emailValue) {
            const existing = await this.repo.getUserBaseByEmail(emailValue)
            if (existing) return { success: false, error: 'alreadyRegistered' }
        }
        if (username) {
            const existing = await this.repo.getUserBaseByUsername(username)
            if (existing) return { success: false, error: 'alreadyRegistered' }
        }

        const hash = await bcrypt.hash(String(password), 10)
        const inserted = await this.repo.insertUser({
            username: username ?? null,
            email: emailValue ?? null,
            passwordHash: hash,
        })

        const sessionProfileIdRaw = Number(this.config.auth?.sessionProfileId ?? 1)
        const sessionProfileId =
            Number.isFinite(sessionProfileIdRaw) && sessionProfileIdRaw > 0
                ? sessionProfileIdRaw
                : 1

        await this.repo.upsertUserProfile({
            userId: inserted.user_id,
            profileId: sessionProfileId,
        })

        if (this.config.auth?.requireEmailVerification && emailValue) {
            await this.sendVerificationEmail(inserted.user_id, emailValue)
        }

        return { success: true }
    }

    async sendVerificationEmail(userId: number, emailTo: string): Promise<void> {
        try {
            const purpose = String(
                this.config.auth?.emailVerificationPurpose ?? 'email_verification'
            )
            await this.repo.consumeOneTimeCodesForUserPurpose({ userId, purpose })

            const expiresSeconds = Number(this.config.auth?.emailVerificationExpiresSeconds ?? 900)
            const maxAttempts = Number(this.config.auth?.emailVerificationMaxAttempts ?? 5)

            const token = randomBytes(32).toString('hex')
            const code = String(Math.floor(100000 + Math.random() * 900000))
            const tokenHash = this.sha256Hex(token)
            const codeHash = this.sha256Hex(code)

            await this.repo.insertOneTimeCode({
                userId,
                purpose,
                codeHash,
                expiresSeconds,
                meta: { tokenHash, maxAttempts },
            })

            await this.email.sendEmailVerification({
                to: emailTo,
                token,
                code,
                appName: this.config.app?.name,
            })
        } catch (err) {
            this.log.show({
                type: this.log.TYPE_ERROR,
                msg: `AuthService.sendVerificationEmail error: ${err}`,
            })
        }
    }

    // ... Implement other methods (requestEmailVerification, verifyEmail, etc.)
    // For brevity in this refactor step, I will focus on Register flow first to prove the Architecture.

    // BUT user requested 'Refactor Auth Module' completely. I should port all logic.

    async requestEmailVerification(identifier: string): Promise<void> {
        let user = null
        if (identifier.includes('@')) user = await this.repo.getUserByEmail(identifier)
        else user = await this.repo.getUserByUsername(identifier)

        if (!user || !user.user_em) return // Silent success

        await this.sendVerificationEmail(user.user_id, user.user_em)
    }

    async verifyEmail(token: string, code: string): Promise<{ success: boolean; error?: string }> {
        const purpose = String(this.config.auth?.emailVerificationPurpose ?? 'email_verification')
        const tokenHash = this.sha256Hex(token)
        const codeHash = this.sha256Hex(code)

        const otp = await this.repo.getValidOneTimeCodeForPurposeAndTokenHash({
            purpose,
            tokenHash,
            codeHash,
        })

        if (!otp) {
            const active = await this.repo.getActiveOneTimeCodeForPurposeAndTokenHash({
                purpose,
                tokenHash,
            })
            if (active?.expires_at) {
                const expiresAt = new Date(active.expires_at)
                if (!Number.isNaN(expiresAt.getTime()) && expiresAt.getTime() <= Date.now()) {
                    return { success: false, error: 'expiredToken' }
                }
            }
            return { success: false, error: 'invalidToken' }
        }

        const attempts = Number(otp.attempt_count ?? 0)
        const maxAttempts = Number(this.config.auth?.emailVerificationMaxAttempts ?? 5)
        if (Number.isFinite(maxAttempts) && attempts >= maxAttempts) {
            return { success: false, error: 'tooManyRequests' }
        }

        await this.repo.setUserEmailVerified(otp.user_id)
        try {
            await this.repo.consumeOneTimeCode(otp.code_id)
        } catch {}

        return { success: true }
    }

    async requestPasswordReset(identifier: string, ip?: string, userAgent?: string): Promise<void> {
        let user = null
        if (identifier.includes('@')) user = await this.repo.getUserByEmail(identifier)
        else user = await this.repo.getUserByUsername(identifier)

        if (!user || !user.user_em) return

        const ctxIp = ip && ip.trim().length > 0 ? ip.trim() : '0.0.0.0'
        const ctxUa = userAgent?.trim() ?? null

        const expiresSeconds = Number(this.config.auth?.passwordResetExpiresSeconds ?? 900)
        const maxAttempts = Number(this.config.auth?.passwordResetMaxAttempts ?? 5)
        const purpose = String(this.config.auth?.passwordResetPurpose ?? 'password_reset')

        try {
            await this.repo.invalidateActivePasswordResetsForUser(user.user_id)
        } catch {}
        try {
            await this.repo.consumeOneTimeCodesForUserPurpose({ userId: user.user_id, purpose })
        } catch {}

        const token = randomBytes(32).toString('hex')
        const code = String(Math.floor(100000 + Math.random() * 900000))
        const tokenHash = this.sha256Hex(token)
        const codeHash = this.sha256Hex(code)

        await this.repo.insertPasswordReset({
            userId: user.user_id,
            tokenHash,
            sentTo: user.user_em,
            expiresSeconds,
            ip: ctxIp,
            userAgent: ctxUa,
        })

        await this.repo.insertOneTimeCode({
            userId: user.user_id,
            purpose,
            codeHash,
            expiresSeconds,
            meta: {
                tokenHash,
                maxAttempts,
                request: { ip: ctxIp, userAgent: ctxUa },
            },
        })

        try {
            await this.email.sendPasswordReset({
                to: user.user_em,
                token,
                code,
                appName: this.config.app?.name,
            })
        } catch (err) {
            this.log.show({
                type: this.log.TYPE_ERROR,
                msg: `AuthService.sendPasswordReset error: ${err}`,
            })
        }
    }

    async verifyPasswordReset(
        token: string,
        code: string
    ): Promise<{ success: boolean; error?: string; resetId?: number; userId?: number }> {
        const purpose = String(this.config.auth?.passwordResetPurpose ?? 'password_reset')
        const tokenHash = this.sha256Hex(token)
        const reset = await this.repo.getPasswordResetByTokenHash(tokenHash)

        if (!reset || reset.used_at) return { success: false, error: 'invalidToken' }

        const expiresAt = reset.expires_at ? new Date(reset.expires_at) : null
        if (!expiresAt || Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() <= Date.now()) {
            return { success: false, error: 'expiredToken' }
        }

        const codeHash = this.sha256Hex(code)
        const otp = await this.repo.getValidOneTimeCode({
            userId: reset.user_id,
            purpose,
            codeHash,
        })

        if (!otp) {
            try {
                await this.repo.incrementPasswordResetAttempt(reset.reset_id)
            } catch {}
            return { success: false, error: 'invalidToken' }
        }

        const attempts = Number(otp.attempt_count ?? 0)
        const maxAttempts = Number(this.config.auth?.passwordResetMaxAttempts ?? 5)
        if (Number.isFinite(maxAttempts) && attempts >= maxAttempts) {
            return { success: false, error: 'tooManyRequests' }
        }

        return {
            success: true,
            resetId: reset.reset_id,
            userId: reset.user_id,
            otpCodeId: otp.code_id,
        } as any
    }

    async resetPassword(
        token: string,
        code: string,
        newPassword: string
    ): Promise<{ success: boolean; error?: string }> {
        const check = await this.verifyPasswordReset(token, code)
        if (!check.success || !check.resetId || !check.userId) return check // Propagate error

        const hash = await bcrypt.hash(newPassword, 10)
        await this.repo.updateUserPassword({ userId: check.userId, passwordHash: hash })

        try {
            await this.repo.consumeOneTimeCode((check as any).otpCodeId)
        } catch {}
        try {
            await this.repo.markPasswordResetUsed(check.resetId)
        } catch {}

        await this.repo.invalidateAllUserSessions(check.userId)

        return { success: true }
    }
}
