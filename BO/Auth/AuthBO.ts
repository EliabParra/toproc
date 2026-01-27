import { BaseBO, BODependencies } from '../../src/core/base/BaseBO.js'
import { ApiResponse } from '../../src/core/response/ApiResponse.js'
import { AuthService } from './Auth.Service.js'
import {
    AuthSchemas,
    RegisterInput,
    VerifyEmailInput,
    ResetPasswordInput,
    ResetPasswordConfirmInput,
} from './Auth.Schemas.js'
import { AuthMessages } from './Auth.Messages.js'
import { isAuthError } from './Auth.Errors.js'

export class AuthBO extends BaseBO {
    private service: AuthService

    constructor(deps: BODependencies) {
        super(deps)
        this.service = new AuthService(this.log, this.config)
    }

    async register(params: RegisterInput): Promise<ApiResponse> {
        try {
            const vRes = this.validate<RegisterInput>(params, AuthSchemas.register)
            if (!vRes.ok) return this.validationError(vRes.alerts)

            await this.service.register(vRes.data)
            return this.created(null, AuthMessages.REGISTER_SUCCESS)
        } catch (err) {
            if (isAuthError(err)) return this.error(err.message, err.code)
            return this.error('Error desconocido en registro')
        }
    }

    async verifyEmail(params: VerifyEmailInput): Promise<ApiResponse> {
        try {
            const vRes = this.validate<VerifyEmailInput>(params, AuthSchemas.verifyEmail)
            if (!vRes.ok) return this.validationError(vRes.alerts)

            await this.service.verifyEmail(vRes.data.token)
            return this.success(null, AuthMessages.EMAIL_VERIFIED)
        } catch (err) {
            if (isAuthError(err)) return this.error(err.message, err.code)
            return this.error('Error en verificación de email')
        }
    }

    async requestPasswordReset(params: ResetPasswordInput): Promise<ApiResponse> {
        try {
            const vRes = this.validate<ResetPasswordInput>(params, AuthSchemas.resetPassword)
            if (!vRes.ok) return this.validationError(vRes.alerts)

            await this.service.requestPasswordReset(vRes.data.email)
            return this.success(null, AuthMessages.PASSWORD_RESET_SENT)
        } catch (err) {
            if (isAuthError(err)) return this.error(err.message, err.code)
            return this.error('Error solicitando reset de password')
        }
    }

    async resetPassword(params: ResetPasswordConfirmInput): Promise<ApiResponse> {
        try {
            const vRes = this.validate<ResetPasswordConfirmInput>(
                params,
                AuthSchemas.resetPasswordConfirm
            )
            if (!vRes.ok) return this.validationError(vRes.alerts)

            await this.service.resetPassword(vRes.data.token, vRes.data.newPassword)
            return this.success(null, AuthMessages.PASSWORD_CHANGED)
        } catch (err) {
            if (isAuthError(err)) return this.error(err.message, err.code)
            return this.error('Error cambiando password')
        }
    }
}
