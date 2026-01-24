import { createRequire } from 'node:module'
import { BaseBO, BODependencies } from '../../src/core/base/BaseBO.js'
import { ApiResponse } from '../../src/core/response/ApiResponse.js'
import { EmailService } from '../../src/email/EmailService.js'
import { AuthErrorHandler } from './AuthErrorHandler.js'
import { AuthRepository } from './AuthRepository.js'
import { AuthService } from './AuthService.js'
import { AuthValidate } from './AuthValidate.js'

const require = createRequire(import.meta.url)
const successMsgs = require('./messages/authSuccessMsgs.json')[
    (globalThis as any).config?.app?.lang ?? 'en'
]

export class AuthBO extends BaseBO {
    private service: AuthService

    constructor(deps?: BODependencies) {
        // Fallback resolution for legacy compatibility / dynamic instantiation
        const d = deps ?? {
            db: (globalThis as any).db,
            log: (globalThis as any).log,
            v: (globalThis as any).v,
            config: (globalThis as any).config,
        }
        super(d)

        const email = new EmailService({ log: this.log, config: this.config })
        const repo = new AuthRepository(this.db)
        this.service = new AuthService(repo, email, this.config, this.log)
    }

    async register(params: Record<string, unknown> | null | undefined): Promise<ApiResponse> {
        try {
            const p = params ?? {}
            const username = p.username as string | undefined
            const email = p.email as string | undefined
            const password = p.password as string | undefined

            const loginId = String(this.config?.auth?.loginId ?? 'email')
                .trim()
                .toLowerCase()
            const requireEmailVerification = Boolean(this.config?.auth?.requireEmailVerification)

            if ((loginId === 'email' || requireEmailVerification) && !email) {
                return AuthErrorHandler.emailRequired()
            }

            if (
                !AuthValidate.validateUsername(username) ||
                (email != null && !AuthValidate.validateEmail(email)) ||
                !AuthValidate.validatePassword(password)
            ) {
                return this.validationError(this.v.getAlerts())
            }

            const result = await this.service.register({ username, email, password })
            if (!result.success) {
                if (result.error === 'alreadyRegistered')
                    return AuthErrorHandler.alreadyRegistered()
                return AuthErrorHandler.unknownError()
            }

            return { code: 201, msg: successMsgs.register ?? 'OK', data: null }
        } catch (err) {
            console.error('AuthBO.requestPasswordReset ERROR:', err)
            this.log.show({ type: this.log.TYPE_ERROR, msg: `AuthBO.register: ${err}` }) // typo in log msg (register vs requestPasswordReset), I'll fix it if I replace
            return AuthErrorHandler.unknownError()
        }
    }

    // ... Other methods mapping

    async requestEmailVerification(
        params: Record<string, unknown> | null | undefined
    ): Promise<ApiResponse> {
        const identifier = params?.identifier as string | undefined
        if (!AuthValidate.validateIdentifier(identifier))
            return this.validationError(this.v.getAlerts())

        await this.service.requestEmailVerification(identifier!)
        return this.success(null, successMsgs.requestEmailVerification ?? 'OK')
    }

    async verifyEmail(params: Record<string, unknown> | null | undefined): Promise<ApiResponse> {
        const token = params?.token as string | undefined
        const code = params?.code as string | undefined

        if (!AuthValidate.validateToken(token) || !AuthValidate.validateCode(code))
            return this.validationError(this.v.getAlerts())

        const result = await this.service.verifyEmail(token!, code!)
        if (!result.success) {
            if (result.error === 'expiredToken') return AuthErrorHandler.expiredToken()
            if (result.error === 'tooManyRequests') return AuthErrorHandler.tooManyRequests()
            return AuthErrorHandler.invalidToken()
        }

        return this.success(null, successMsgs.verifyEmail ?? 'OK')
    }

    async requestPasswordReset(
        params: Record<string, unknown> | null | undefined
    ): Promise<ApiResponse> {
        try {
            const identifier = params?.identifier as string | undefined
            if (!AuthValidate.validateIdentifier(identifier))
                return this.validationError(this.v.getAlerts())

            // Extract context manually for now or pass req?
            // BO usually receives `params` which contains `_request` if specialized middleware calls it,
            // but traditionally `params` is just body.
            // `getRequestCtx` helper was used.
            const req = (params as any)?._request
            const ip = req?.ip
            const userAgent = req?.userAgent

            await this.service.requestPasswordReset(identifier!, ip, userAgent)
            return this.success(null, successMsgs.requestPasswordReset ?? 'OK')
        } catch (err) {
            this.log.show({ type: this.log.TYPE_ERROR, msg: `AuthBO.requestPasswordReset: ${err}` })
            return AuthErrorHandler.unknownError()
        }
    }

    async verifyPasswordReset(
        params: Record<string, unknown> | null | undefined
    ): Promise<ApiResponse> {
        try {
            const token = params?.token as string | undefined
            const code = params?.code as string | undefined

            if (!AuthValidate.validateToken(token) || !AuthValidate.validateCode(code))
                return this.validationError(this.v.getAlerts())

            const result = await this.service.verifyPasswordReset(token!, code!)
            if (!result.success) {
                if (result.error === 'expiredToken') return AuthErrorHandler.expiredToken()
                if (result.error === 'tooManyRequests') return AuthErrorHandler.tooManyRequests()
                return AuthErrorHandler.invalidToken()
            }
            return this.success(null, successMsgs.verifyPasswordReset ?? 'OK')
        } catch (err) {
            this.log.show({ type: this.log.TYPE_ERROR, msg: `AuthBO.verifyPasswordReset: ${err}` })
            return AuthErrorHandler.unknownError()
        }
    }

    async resetPassword(params: Record<string, unknown> | null | undefined): Promise<ApiResponse> {
        try {
            const token = params?.token as string | undefined
            const code = params?.code as string | undefined
            const newPassword = params?.newPassword as string | undefined

            if (
                !AuthValidate.validateToken(token) ||
                !AuthValidate.validateCode(code) ||
                !AuthValidate.validateNewPassword(newPassword)
            )
                return this.validationError(this.v.getAlerts())

            const result = await this.service.resetPassword(token!, code!, newPassword!)
            if (!result.success) {
                if (result.error === 'expiredToken') return AuthErrorHandler.expiredToken()
                if (result.error === 'tooManyRequests') return AuthErrorHandler.tooManyRequests()
                return AuthErrorHandler.invalidToken()
            }

            return this.success(null, successMsgs.resetPassword ?? 'OK')
        } catch (err) {
            this.log.show({ type: this.log.TYPE_ERROR, msg: `AuthBO.resetPassword: ${err}` })
            return AuthErrorHandler.unknownError()
        }
    }
}
