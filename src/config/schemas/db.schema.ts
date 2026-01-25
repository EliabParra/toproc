import { z } from 'zod'

export const DbConfigSchema = z
    .object({
        host: z.string().default('localhost'),
        port: z.number().int().default(5432),
        database: z.string().default('postgres'),
        user: z.string().default('postgres'),
        password: z.string().default(''),
        ssl: z.boolean().default(false),
        connectionString: z.string().optional(),
    })
    .transform((config) => {
        // If connectionString is provided, it takes precedence in some drivers,
        // but individual fields are useful for validation or logging (masked).
        return config
    })

export type DbConfig = z.infer<typeof DbConfigSchema>
