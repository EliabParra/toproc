import { z } from 'zod'
import { AuthMessages } from './Auth.Messages.js'

export const AuthSchemas = {
    login: z.object({
        loginId: z.string().min(1, AuthMessages.VALIDATION.LOGIN_ID_REQUIRED),
        password: z.string().min(1, AuthMessages.VALIDATION.PASSWORD_REQUIRED),
    }),

    register: z.object({
        email: z.string().email(AuthMessages.VALIDATION.EMAIL_INVALID),
        password: z.string().min(8, AuthMessages.VALIDATION.PASSWORD_TOO_SHORT),
        name: z.string().optional(),
    }),

    logout: z.object({
        sessionId: z.string().optional(),
    }),

    verifyEmail: z.object({
        token: z.string().min(1, AuthMessages.VALIDATION.TOKEN_REQUIRED),
    }),

    resetPassword: z.object({
        email: z.string().email(AuthMessages.VALIDATION.EMAIL_INVALID),
    }),

    resetPasswordConfirm: z.object({
        token: z.string().min(1, AuthMessages.VALIDATION.TOKEN_REQUIRED),
        newPassword: z.string().min(8, AuthMessages.VALIDATION.PASSWORD_TOO_SHORT),
    }),

    changePassword: z.object({
        currentPassword: z.string().min(1, AuthMessages.VALIDATION.PASSWORD_REQUIRED),
        newPassword: z.string().min(8, AuthMessages.VALIDATION.PASSWORD_TOO_SHORT),
    }),
}

export type LoginInput = z.infer<typeof AuthSchemas.login>
export type RegisterInput = z.infer<typeof AuthSchemas.register>
export type LogoutInput = z.infer<typeof AuthSchemas.logout>
export type VerifyEmailInput = z.infer<typeof AuthSchemas.verifyEmail>
export type ResetPasswordInput = z.infer<typeof AuthSchemas.resetPassword>
export type ResetPasswordConfirmInput = z.infer<typeof AuthSchemas.resetPasswordConfirm>
export type ChangePasswordInput = z.infer<typeof AuthSchemas.changePassword>
