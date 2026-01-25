import { z } from 'zod'

export const AuthConfigSchema = z.object({
    loginId: z.enum(['email', 'username']).default('email'),
    login2StepNewDevice: z.boolean().default(false),
    publicProfileId: z.number().int().default(999),
    sessionProfileId: z.number().int().default(1),
    requireEmailVerification: z.boolean().default(false),
    // Add more auth flags as needed based on analysis of globals
})

export type AuthConfig = z.infer<typeof AuthConfigSchema>
