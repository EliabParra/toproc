import { z } from 'zod'

export const SessionConfigSchema = z.object({
    secret: z.union([z.string(), z.array(z.string())]).default('secret'),
    store: z
        .object({
            schemaName: z.string().optional(),
            tableName: z.string().optional(),
        })
        .default({}),
    cookie: z
        .object({
            secure: z.boolean().default(false),
            httpOnly: z.boolean().default(true),
            maxAge: z.number().int().default(86400000), // 24h
            sameSite: z.union([z.boolean(), z.enum(['lax', 'strict', 'none'])]).default('lax'),
        })
        .default({
            secure: false,
            httpOnly: true,
            maxAge: 86400000,
            sameSite: 'lax',
        }),
})

export type SessionConfig = z.infer<typeof SessionConfigSchema>
