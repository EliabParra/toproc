import { z } from 'zod'

export const LogConfigSchema = z.object({
    format: z.enum(['text', 'json', 'pretty']).default('text'),
    minLevel: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
    timestamp: z.boolean().default(true),
    categories: z.record(z.string(), z.enum(['debug', 'info', 'warn', 'error'])).optional(),
})

export type LogConfig = z.infer<typeof LogConfigSchema>

export const EmailConfigSchema = z.object({
    mode: z.enum(['smtp', 'log']).default('log'),
    smtpHost: z.string().optional(),
    smtpPort: z.number().int().optional(),
    smtpUser: z.string().optional(),
    smtpPass: z.string().optional(),
    smtpSecure: z.boolean().optional(),
    from: z.string().optional(),
})

export type EmailConfig = z.infer<typeof EmailConfigSchema>
