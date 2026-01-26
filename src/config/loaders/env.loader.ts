import { Config } from '../schemas/index.js'
import { PartialDeep, envBool, envInt, envList } from '../utils/env.utils.js'

/**
 * Cargador de configuración desde variables de entorno.
 *
 * Mapea `process.env` a la estructura de configuración `Config`.
 * Realiza conversiones de tipos básicas (int, bool, list) usando utilidades.
 */
export class EnvLoader {
    static load(): PartialDeep<Config> {
        const env = process.env

        return {
            app: {
                host: env.APP_HOST,
                port: envInt(env.APP_PORT),
                name: env.APP_NAME,
                env: env.NODE_ENV as any,
                lang: env.APP_LANG as any,
                frontendMode: env.APP_FRONTEND_MODE as any,
                trustProxy: env.APP_TRUST_PROXY,
            },
            db: {
                host: env.PGHOST,
                port: envInt(env.PGPORT),
                user: env.PGUSER,
                password: env.PGPASSWORD,
                database: env.PGDATABASE,
                ssl: envBool(env.PGSSL),
                connectionString: env.DATABASE_URL,
            },
            session: {
                secret: env.SESSION_SECRETS ? envList(env.SESSION_SECRETS) : env.SESSION_SECRET,
                store: {
                    schemaName: env.SESSION_SCHEMA,
                    tableName: env.SESSION_TABLE,
                },
                cookie: {
                    secure: envBool(env.SESSION_COOKIE_SECURE),
                    sameSite: env.SESSION_COOKIE_SAMESITE as any,
                    maxAge: envInt(env.SESSION_COOKIE_MAXAGE_MS),
                },
            },
            log: {
                format: env.LOG_FORMAT as any,
            },
            email: {
                mode: env.EMAIL_MODE as any,
                smtpHost: env.SMTP_HOST,
                smtpPort: envInt(env.SMTP_PORT),
                smtpUser: env.SMTP_USER,
                smtpPass: env.SMTP_PASS,
                smtpSecure: envBool(env.SMTP_SECURE),
                from: env.SMTP_FROM,
            },
            auth: {
                loginId: env.AUTH_LOGIN_ID as any,
                login2StepNewDevice: envBool(env.AUTH_LOGIN_2STEP_NEW_DEVICE),
                publicProfileId: envInt(env.AUTH_PUBLIC_PROFILE_ID),
                sessionProfileId: envInt(env.AUTH_SESSION_PROFILE_ID),
                requireEmailVerification: envBool(env.AUTH_REQUIRE_EMAIL_VERIFICATION),
            },
            cors: {
                enabled: envBool(env.CORS_ENABLED),
                credentials: envBool(env.CORS_CREDENTIALS),
                origins: envList(env.CORS_ORIGINS),
            },
        }
    }
}
