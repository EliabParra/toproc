import { z } from 'zod'

export const CorsConfigSchema = z.object({
    enabled: z.boolean().default(true),
    credentials: z.boolean().default(true),
    origins: z.array(z.string()).default(['*']),
})

export type CorsConfig = z.infer<typeof CorsConfigSchema>

export const BoConfigSchema = z.object({
    path: z.string().default('../../BO/'),
})

export type BoConfig = z.infer<typeof BoConfigSchema>
