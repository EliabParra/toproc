import { createRequire } from 'node:module'
import { BaseBO, BODependencies } from '../../src/core/base/BaseBO.js'
import { ApiResponse } from '../../src/core/response/ApiResponse.js'
import { EmailService } from '../../src/email/EmailService.js'
import { AuthErrorHandler } from './AuthErrorHandler.js'
import { AuthRepository } from './AuthRepository.js'
import { AuthService } from './AuthService.js'
import { AuthSchemas } from './schemas.js'
import { z } from 'zod'

const require = createRequire(import.meta.url)
// Access legacy config via globalThis if needed for messages or inject?
// We fall back to globalThis for now to support legacy usage
const getLang = () => (globalThis as any).config?.app?.lang ?? 'en'
const successMsgsRaw = require('./messages/authSuccessMsgs.json')

export class AuthBO extends BaseBO {
    private service: AuthService

    constructor(deps?: BODependencies) {
        // Fallback resolution for legacy compatibility / dynamic instantiation
        const d = deps ?? {
            db: (globalThis as any).db,
            log: (globalThis as any).log,
            v: (globalThis as any).validator, // Use AppValidator (Zod)
            config: (globalThis as any).config,
            i18n: (globalThis as any).i18n,
            msgs: (globalThis as any).msgs,
        }
        super(d)

        const email = new EmailService({ log: this.log, config: this.config })
        const repo = new AuthRepository(this.db)
        this.service = new AuthService(repo, email, this.config, this.log)
    }

    private get successMsgs() {
        return successMsgsRaw[getLang()]
    }

    async register(params: unknown): Promise<ApiResponse> {
        try {
            const vRes = this.validate<z.infer<typeof AuthSchemas.register>>(
                params,
                AuthSchemas.register
            )
            if (!vRes.ok) return this.validationError(vRes.alerts)

            const { username, email, password } = vRes.data

            const loginId = String(this.config?.auth?.loginId ?? 'email')
                .trim()
                .toLowerCase()
            const requireEmailVerification = Boolean(this.config?.auth?.requireEmailVerification)

            if ((loginId === 'email' || requireEmailVerification) && !email) {
                return AuthErrorHandler.emailRequired()
            }

            const result = await this.service.register({ username, email, password })
            if (!result.success) {
                if (result.error === 'alreadyRegistered')
                    return AuthErrorHandler.alreadyRegistered()
                return AuthErrorHandler.unknownError()
            }

            return this.created(null, this.successMsgs.register ?? 'OK')
        } catch (err) {
            this.log.show({ type: this.log.TYPE_ERROR, msg: `AuthBO.register: ${err}` })
            return AuthErrorHandler.unknownError()
        }
    }

    async requestEmailVerification(params: unknown): Promise<ApiResponse> {
        try {
            const vRes = this.validate<z.infer<typeof AuthSchemas.requestEmailVerification>>(
                params,
                AuthSchemas.requestEmailVerification
            )
            if (!vRes.ok) return this.validationError(vRes.alerts)

            await this.service.requestEmailVerification(vRes.data.identifier)
            return this.success(null, this.successMsgs.requestEmailVerification ?? 'OK')
        } catch (err) {
            this.log.show({
                type: this.log.TYPE_ERROR,
                msg: `AuthBO.requestEmailVerification: ${err}`,
            })
            return AuthErrorHandler.unknownError()
        }
    }

    async verifyEmail(params: unknown): Promise<ApiResponse> {
        try {
            const vRes = this.validate<z.infer<typeof AuthSchemas.verifyEmail>>(
                params,
                AuthSchemas.verifyEmail
            )
            if (!vRes.ok) return this.validationError(vRes.alerts)

            const { token, code } = vRes.data
            const result = await this.service.verifyEmail(token, code)

            if (!result.success) {
                if (result.error === 'expiredToken') return AuthErrorHandler.expiredToken()
                if (result.error === 'tooManyRequests') return AuthErrorHandler.tooManyRequests()
                return AuthErrorHandler.invalidToken()
            }

            return this.success(null, this.successMsgs.verifyEmail ?? 'OK')
        } catch (err) {
            this.log.show({ type: this.log.TYPE_ERROR, msg: `AuthBO.verifyEmail: ${err}` })
            return AuthErrorHandler.unknownError()
        }
    }

    async requestPasswordReset(params: unknown): Promise<ApiResponse> {
        try {
            const vRes = this.validate<z.infer<typeof AuthSchemas.requestPasswordReset>>(
                params,
                AuthSchemas.requestPasswordReset
            )
            if (!vRes.ok) return this.validationError(vRes.alerts)

            // Extract context manually for now or pass req?
            // BO usually receives `params` which contains `_request` if specialized middleware calls it.
            const req = (params as any)?._request
            const ip = req?.ip
            const userAgent = req?.userAgent

            await this.service.requestPasswordReset(vRes.data.identifier, ip, userAgent)
            return this.success(null, this.successMsgs.requestPasswordReset ?? 'OK')
        } catch (err) {
            this.log.show({ type: this.log.TYPE_ERROR, msg: `AuthBO.requestPasswordReset: ${err}` })
            return AuthErrorHandler.unknownError()
        }
    }

    async verifyPasswordReset(params: unknown): Promise<ApiResponse> {
        try {
            const vRes = this.validate<z.infer<typeof AuthSchemas.verifyPasswordReset>>(
                params,
                AuthSchemas.verifyPasswordReset
            )
            if (!vRes.ok) return this.validationError(vRes.alerts)

            const { token, code } = vRes.data
            const result = await this.service.verifyPasswordReset(token, code)

            if (!result.success) {
                if (result.error === 'expiredToken') return AuthErrorHandler.expiredToken()
                if (result.error === 'tooManyRequests') return AuthErrorHandler.tooManyRequests()
                return AuthErrorHandler.invalidToken()
            }
            return this.success(null, this.successMsgs.verifyPasswordReset ?? 'OK')
        } catch (err) {
            this.log.show({ type: this.log.TYPE_ERROR, msg: `AuthBO.verifyPasswordReset: ${err}` })
            return AuthErrorHandler.unknownError()
        }
    }

    async resetPassword(params: unknown): Promise<ApiResponse> {
        try {
            const vRes = this.validate<z.infer<typeof AuthSchemas.resetPassword>>(
                params,
                AuthSchemas.resetPassword
            )
            if (!vRes.ok) return this.validationError(vRes.alerts)

            const { token, code, newPassword } = vRes.data
            const result = await this.service.resetPassword(token, code, newPassword)

            if (!result.success) {
                if (result.error === 'expiredToken') return AuthErrorHandler.expiredToken()
                if (result.error === 'tooManyRequests') return AuthErrorHandler.tooManyRequests()
                return AuthErrorHandler.invalidToken()
            }

            return this.success(null, this.successMsgs.resetPassword ?? 'OK')
        } catch (err) {
            this.log.show({ type: this.log.TYPE_ERROR, msg: `AuthBO.resetPassword: ${err}` })
            return AuthErrorHandler.unknownError()
        }
    }

    // Login logic was missing in original file provided?
    // It was likely just not shown or I missed it.
    // I should implement login if it existed or if required.
    // Based on `schemas.ts` having `login`, I should probably support it if the service supports it.
    // The previous file content did NOT show `login`.
    // It showed `// ... Other methods mapping`.
    // I will stick to the methods I saw in the file content.
}
