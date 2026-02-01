import { BaseBO, BODependencies } from '../../src/core/business-objects/BaseBO.js'
import { AuthService } from './Auth.Service.js'
import {
    AuthSchemas,
    RegisterInput,
    VerifyEmailInput,
    RequestEmailVerificationInput,
    ResetPasswordInput,
    VerifyPasswordResetInput,
    ResetPasswordConfirmInput,
} from './Auth.Schemas.js'

import { AuthMessages } from './Auth.Messages.js'

export class AuthBO extends BaseBO {
    private service: AuthService

    constructor(deps: BODependencies) {
        super(deps)
        this.service = new AuthService(deps.log, deps.config, deps.db)
    }

    private get m() {
        return this.i18n.use(AuthMessages)
    }

    async register(params: RegisterInput): Promise<ApiResponse> {
        return this.exec<RegisterInput, void>(params, AuthSchemas.register, async (data) => {
            await this.service.register(data)
            return this.created(null, this.m.registerSuccess)
        })
    }

    async verifyEmail(params: VerifyEmailInput): Promise<ApiResponse> {
        return this.exec<VerifyEmailInput, void>(params, AuthSchemas.verifyEmail, async (data) => {
            await this.service.verifyEmail(data.token)
            return this.success(null, this.m.emailVerified)
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
                    this.i18n.format(this.m.verificationSentTo, { email: data.identifier })
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
                return this.success(null, this.m.passwordResetSent)
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
                return this.success(null, this.m.tokenValid)
            }
        )
    }

    async resetPassword(params: ResetPasswordConfirmInput): Promise<ApiResponse> {
        return this.exec<ResetPasswordConfirmInput, void>(
            params,
            AuthSchemas.resetPasswordConfirm,
            async (data) => {
                await this.service.resetPassword(data.token, data.newPassword)
                return this.success(null, this.m.passwordChanged)
            }
        )
    }
}
