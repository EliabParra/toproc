import { BaseBO, BODependencies, ApiResponse } from '../../src/core/business-objects/index.js'
import { AuthService, AuthMessages, createAuthSchemas, Schemas } from './AuthModule.js'

export class AuthBO extends BaseBO {
    private service: AuthService

    constructor(deps: BODependencies) {
        super(deps)
        this.service = new AuthService(deps.log, deps.config, deps.db, deps.i18n, deps.email)
    }

    private get authMessages() {
        return this.i18n.use(AuthMessages)
    }

    private get authSchemas() {
        return createAuthSchemas(this.authMessages)
    }

    async register(params: Schemas.RegisterInput): Promise<ApiResponse> {
        return this.exec<Schemas.RegisterInput, void>(params, this.authSchemas.register, async (data) => {
            await this.service.register(data)
            return this.created(null, this.authMessages.registerSuccess)
        })
    }

    async verifyEmail(params: Schemas.VerifyEmailInput): Promise<ApiResponse> {
        return this.exec<Schemas.VerifyEmailInput, void>(
            params,
            this.authSchemas.verifyEmail,
            async (data) => {
                await this.service.verifyEmail(data.token)
                return this.success(null, this.authMessages.emailVerified)
            }
        )
    }

    async requestEmailVerification(params: Schemas.RequestEmailVerificationInput): Promise<ApiResponse> {
        return this.exec<Schemas.RequestEmailVerificationInput, void>(
            params,
            this.authSchemas.requestEmailVerification,
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

    async requestPasswordReset(params: Schemas.RequestPasswordResetInput): Promise<ApiResponse> {
        return this.exec<Schemas.RequestPasswordResetInput, void>(
            params,
            this.authSchemas.requestResetPassword,
            async (data) => {
                await this.service.requestPasswordReset(data.email)
                return this.success(null, this.authMessages.passwordResetSent)
            }
        )
    }

    async verifyPasswordReset(params: Schemas.VerifyPasswordResetInput): Promise<ApiResponse> {
        return this.exec<Schemas.VerifyPasswordResetInput, void>(
            params,
            this.authSchemas.verifyPasswordReset,
            async (data) => {
                // Just verification of token existence/validity
                await this.service.verifyPasswordResetToken(data.token)
                return this.success(null, this.authMessages.tokenValid)
            }
        )
    }

    async resetPassword(params: Schemas.ResetPasswordConfirmInput): Promise<ApiResponse> {
        return this.exec<Schemas.ResetPasswordConfirmInput, void>(
            params,
            this.authSchemas.resetPasswordConfirm,
            async (data) => {
                await this.service.resetPassword(data.token, data.newPassword)
                return this.success(null, this.authMessages.passwordChanged)
            }
        )
    }
}
