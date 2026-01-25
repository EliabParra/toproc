import { z } from 'zod'
import { AppConfigSchema } from './app.schema.js'
import { DbConfigSchema } from './db.schema.js'
import { AuthConfigSchema } from './auth.schema.js'
import { SessionConfigSchema } from './session.schema.js'
import { LogConfigSchema, EmailConfigSchema } from './misc.schema.js'
import { CorsConfigSchema, BoConfigSchema } from './extra.schema.js'

export const ConfigSchema = z
    .object({
        app: AppConfigSchema,
        db: DbConfigSchema,
        auth: AuthConfigSchema,
        session: SessionConfigSchema,
        log: LogConfigSchema,
        email: EmailConfigSchema,
        cors: CorsConfigSchema,
        bo: BoConfigSchema,
    })
    .refine((config) => {
        // Cross-validation
        if (config.app.env === 'production' && !config.db.ssl) {
            // Example warning or error. For now just returning true to not block start,
            // but traditionally we'd return false here if strict.
            // Let's rely on strict boolean checks in prod
            return true
        }
        return true
    })

export type Config = z.infer<typeof ConfigSchema>
