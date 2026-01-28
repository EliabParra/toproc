import { BaseBO, BODependencies } from '../../src/core/business-objects/BaseBO.js'
import { ApiResponse } from '../../src/types/ApiResponse.js'
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
import { isAuthError } from './Auth.Errors.js'

export class AuthBO extends BaseBO {
    private service: AuthService

    constructor(deps?: BODependencies) {
        super(deps)
        this.service = new AuthService(this.log, this.config, this.db)
    }

    async register(params: RegisterInput): Promise<ApiResponse> {
        return this.exec<RegisterInput, void>(params, AuthSchemas.register, async (data) => {
            await this.service.register(data)
            return this.created(null, AuthMessages.REGISTER_SUCCESS)
        })
    }

    async verifyEmail(params: VerifyEmailInput): Promise<ApiResponse> {
        return this.exec<VerifyEmailInput, void>(params, AuthSchemas.verifyEmail, async (data) => {
            await this.service.verifyEmail(data.token)
            return this.success(null, AuthMessages.EMAIL_VERIFIED)
        })
    }

    async requestEmailVerification(params: RequestEmailVerificationInput): Promise<ApiResponse> {
        return this.exec<RequestEmailVerificationInput, void>(
            params,
            AuthSchemas.requestEmailVerification,
            async (data) => {
                await this.service.requestEmailVerification(data.identifier)
                return this.success(null, AuthMessages.VERIFICATION_SENT)
            }
        )
    }

    async requestPasswordReset(params: ResetPasswordInput): Promise<ApiResponse> {
        return this.exec<ResetPasswordInput, void>(params, AuthSchemas.resetPassword, async (data) => {
            await this.service.requestPasswordReset(data.email)
            return this.success(null, AuthMessages.PASSWORD_RESET_SENT)
        })
    }

    async verifyPasswordReset(params: VerifyPasswordResetInput): Promise<ApiResponse> {
        return this.exec<VerifyPasswordResetInput, void>(
            params,
            AuthSchemas.verifyPasswordReset,
            async (data) => {
                // Just verification of token existence/validity
                await this.service.verifyPasswordResetToken(data.token)
                return this.success(null, AuthMessages.TOKEN_VALID)
            }
        )
    }

    async resetPassword(params: ResetPasswordConfirmInput): Promise<ApiResponse> {
        return this.exec<ResetPasswordConfirmInput, void>(
            params,
            AuthSchemas.resetPasswordConfirm,
            async (data) => {
                await this.service.resetPassword(data.token, data.newPassword)
                return this.success(null, AuthMessages.PASSWORD_CHANGED)
            }
        )
    }
}
