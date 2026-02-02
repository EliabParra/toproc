import { z } from 'zod'

export const AuthConfigSchema = z.object({
    loginId: z.enum(['email', 'username']).default('email'),
    login2StepNewDevice: z.boolean().default(false),
    publicProfileId: z.number().int().default(999),
    sessionProfileId: z.number().int().default(1),
    requireEmailVerification: z.boolean().default(false),

    // Cookie & Session
    deviceCookieName: z.string().default('device_token'),
    deviceCookieMaxAgeMs: z.number().int().default(15552000000), // 180 days

    // Challenges & Rate Limits
    loginChallengeExpiresSeconds: z.number().int().default(600),
    loginChallengeMaxAttempts: z.number().int().default(5),

    passwordResetExpiresSeconds: z.number().int().default(900),
    passwordResetMaxAttempts: z.number().int().default(5),
    passwordResetPurpose: z.string().default('password_reset'),

    emailVerificationExpiresSeconds: z.number().int().default(900),
    emailVerificationMaxAttempts: z.number().int().default(5),
    emailVerificationPurpose: z.string().default('email_verification'),
})

export type AuthConfig = z.infer<typeof AuthConfigSchema>
