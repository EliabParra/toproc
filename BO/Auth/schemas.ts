import { z } from 'zod'

/**
 * Esquemas de validación para autenticación.
 *
 * @since 1.0.0
 * @author Team ToProccess
 * @license MIT
 */
export const AuthSchemas = {
    identifier: z.string().trim().min(3).max(320),
    email: z.string().trim().email(),
    username: z.string().trim().min(3).max(80),
    password: z.string().min(8).max(200),
    token: z.string().trim().min(16).max(256),
    code: z.string().trim().min(4).max(12),

    get register() {
        return z
            .object({
                username: this.username.optional(),
                email: this.email.optional(),
                password: this.password,
            })
            .refine((data) => data.username || data.email, {
                message: 'Username or Email is required',
                path: ['identifier'],
            })
    },

    get requestEmailVerification() {
        return z.object({
            identifier: this.identifier,
        })
    },

    get verifyEmail() {
        return z.object({
            token: this.token,
            code: this.code,
        })
    },

    get requestPasswordReset() {
        return z.object({
            identifier: this.identifier,
        })
    },

    get verifyPasswordReset() {
        return z.object({
            token: this.token,
            code: this.code,
        })
    },

    get resetPassword() {
        return z.object({
            token: this.token,
            code: this.code,
            newPassword: this.password, // Reusing password rules for new password
        })
    },

    get login() {
        return z.object({
            identifier: this.identifier,
            password: this.password,
        })
    },
}
