import { z } from 'zod'

export const AuthSchemas = {
    login: z.object({
        identifier: z.string().min(1, 'bo.auth.validation.loginIdRequired'),
        password: z.string().min(1, 'bo.auth.validation.passwordRequired'),
    }),

    register: z.object({
        email: z.string().email('bo.auth.validation.emailInvalid'),
        password: z.string().min(8, 'bo.auth.validation.passwordTooShort'),
        name: z.string().optional(),
    }),

    logout: z.object({
        sessionId: z.string().optional(),
    }),

    verifyEmail: z.object({
        token: z.string().min(1, 'bo.auth.validation.tokenRequired'),
    }),

    requestEmailVerification: z.object({
        identifier: z.string().min(1, 'bo.auth.validation.emailRequired'),
    }),

    resetPassword: z.object({
        email: z.string().email('bo.auth.validation.emailInvalid'),
    }),

    verifyPasswordReset: z.object({
        token: z.string().min(1, 'bo.auth.validation.tokenRequired'),
    }),

    resetPasswordConfirm: z.object({
        token: z.string().min(1, 'bo.auth.validation.tokenRequired'),
        newPassword: z.string().min(8, 'bo.auth.validation.passwordTooShort'),
    }),

    changePassword: z.object({
        currentPassword: z.string().min(1, 'bo.auth.validation.passwordRequired'),
        newPassword: z.string().min(8, 'bo.auth.validation.passwordTooShort'),
    }),
}

export type LoginInput = z.infer<typeof AuthSchemas.login>
export type RegisterInput = z.infer<typeof AuthSchemas.register>
export type LogoutInput = z.infer<typeof AuthSchemas.logout>
export type VerifyEmailInput = z.infer<typeof AuthSchemas.verifyEmail>
export type RequestEmailVerificationInput = z.infer<typeof AuthSchemas.requestEmailVerification>
export type ResetPasswordInput = z.infer<typeof AuthSchemas.resetPassword>
export type VerifyPasswordResetInput = z.infer<typeof AuthSchemas.verifyPasswordReset>
export type ResetPasswordConfirmInput = z.infer<typeof AuthSchemas.resetPasswordConfirm>
export type ChangePasswordInput = z.infer<typeof AuthSchemas.changePassword>
