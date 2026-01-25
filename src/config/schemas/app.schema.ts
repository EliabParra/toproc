import { z } from 'zod'

export const AppConfigSchema = z.object({
    name: z.string().min(1).default('ToProccess API'),
    host: z.string().default('localhost'),
    port: z.number().int().min(1).max(65535).default(3000),
    env: z.enum(['development', 'production', 'test', 'staging']).default('development'),
    frontendMode: z.enum(['none', 'pages', 'spa']).default('none'),
    trustProxy: z.union([z.boolean(), z.number(), z.string()]).default(false),
    lang: z.enum(['es', 'en']).default('es'),
})

export type AppConfig = z.infer<typeof AppConfigSchema>
