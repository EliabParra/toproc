import { BaseBO } from '../../src/core/business-objects/BaseBO.js'
import type { BODependencies } from '../../src/core/business-objects/BaseBO.js'
import type { ApiResponse } from '../../src/types/api.js'
import { AuthService } from './AuthService.js'
import {
    AuthSchemas,
    RegisterInput,
    VerifyEmailInput,
    RequestEmailVerificationInput,
    ResetPasswordInput,
    VerifyPasswordResetInput,
    ResetPasswordConfirmInput,
} from './AuthSchemas.js'

import { AuthMessages } from './AuthMessages.js'

export class AuthBO extends BaseBO {
    private service: AuthService

    constructor(deps: BODependencies) {
        super(deps)
        this.service = new AuthService(deps.log, deps.config, deps.db)
    }

    private get authMessages() {
        return this.i18n.use(AuthMessages)
    }

    async register(params: RegisterInput): Promise<ApiResponse> {
        return this.exec<RegisterInput, void>(params, AuthSchemas.register, async (data) => {
            await this.service.register(data)
            return this.created(null, this.authMessages.registerSuccess)
        })
    }

    async verifyEmail(params: VerifyEmailInput): Promise<ApiResponse> {
        return this.exec<VerifyEmailInput, void>(params, AuthSchemas.verifyEmail, async (data) => {
            await this.service.verifyEmail(data.token)
            return this.success(null, this.authMessages.emailVerified)
        })
    }

    async requestEmailVerification(params: RequestEmailVerificationInput): Promise<ApiResponse> {
        return this.exec<RequestEmailVerificationInput, void>(
            params,
            AuthSchemas.requestEmailVerification,
            async (data) => {
                await this.service.requestEmailVerification(data.identifier)
                return this.success(
                    null,
                    this.i18n.format(this.authMessages.verificationSentTo, {
                        email: data.identifier,
                    })
                )
            }
        )
    }

    async requestPasswordReset(params: ResetPasswordInput): Promise<ApiResponse> {
        return this.exec<ResetPasswordInput, void>(
            params,
            AuthSchemas.resetPassword,
            async (data) => {
                await this.service.requestPasswordReset(data.email)
                return this.success(null, this.authMessages.passwordResetSent)
            }
        )
    }

    async verifyPasswordReset(params: VerifyPasswordResetInput): Promise<ApiResponse> {
        return this.exec<VerifyPasswordResetInput, void>(
            params,
            AuthSchemas.verifyPasswordReset,
            async (data) => {
                // Just verification of token existence/validity
                await this.service.verifyPasswordResetToken(data.token)
                return this.success(null, this.authMessages.tokenValid)
            }
        )
    }

    async resetPassword(params: ResetPasswordConfirmInput): Promise<ApiResponse> {
        return this.exec<ResetPasswordConfirmInput, void>(
            params,
            AuthSchemas.resetPasswordConfirm,
            async (data) => {
                await this.service.resetPassword(data.token, data.newPassword)
                return this.success(null, this.authMessages.passwordChanged)
            }
        )
    }
}
