import {
    InitConfig,
    PartialInitConfig,
    AppConfig,
    DbConfig,
    AuthConfig,
    SecurityConfig,
} from '../types.js'

export const DEFAULT_APP_CONFIG: AppConfig = {
    profile: 'development',
    interactive: true,
    dryRun: false,
    silent: false,
}

export const DEFAULT_DB_CONFIG: DbConfig = {
    host: process.env.PGHOST || process.env.DB_HOST || 'localhost',
    port: Number(process.env.PGPORT || process.env.DB_PORT) || 5432,
    user: process.env.PGUSER || process.env.DB_USER || 'postgres',
    password: process.env.PGPASSWORD || process.env.DB_PASSWORD || '',
    database: process.env.PGDATABASE || process.env.DB_NAME || 'toproc_dev',
    ssl: process.env.PGSSL === 'true' || process.env.DB_SSL === 'true' || false,
}

export const DEFAULT_AUTH_CONFIG: AuthConfig = {
    enabled: process.env.AUTH_ENABLE === 'true' || false,
    usernameSupported: process.env.AUTH_USERNAME !== 'false',
    loginId: (process.env.AUTH_LOGIN_ID as 'email' | 'username') || 'email',
    login2StepNewDevice: process.env.AUTH_LOGIN_2STEP_NEW_DEVICE === 'true' || false,
    publicProfileId: Number(process.env.AUTH_PUBLIC_PROFILE_ID) || 2,
    sessionProfileId: Number(process.env.AUTH_SESSION_PROFILE_ID) || 1,
}

export const DEFAULT_SECURITY_CONFIG: SecurityConfig = {
    seedAdmin: false,
    adminUser: 'admin',
    adminPassword: '',
    adminProfileId: 1,

    seedProfiles: process.env.AUTH_SEED_PROFILES === 'true' || false,
    publicProfileId: Number(process.env.AUTH_PUBLIC_PROFILE_ID) || 2,
    sessionProfileId: Number(process.env.AUTH_SESSION_PROFILE_ID) || 1,

    registerBo: false,
    txStart: undefined,

    seedPublicAuthPerms: process.env.AUTH_SEED_PUBLIC_AUTH_PERMS === 'true' || false,
    includeEmail: false,
    sessionSchema: 'security',
    sessionTable: 'sessions',
}

export const DEFAULT_CONFIG: InitConfig = {
    app: DEFAULT_APP_CONFIG,
    db: DEFAULT_DB_CONFIG,
    auth: DEFAULT_AUTH_CONFIG,
    security: DEFAULT_SECURITY_CONFIG,
}

export const PROFILES: Record<string, any> = {
    development: {
        db: { ssl: false },
        auth: { enabled: true },
    },
    production: {
        db: { ssl: true },
        auth: { enabled: true },
    },
    testing: {
        app: { interactive: false },
        db: { ssl: false },
    },
}

/**
 * Deep merge utility for config objects.
 */
export function deepMerge(base: any, ...overrides: any[]): any {
    const result = { ...base } as any

    for (const override of overrides) {
        if (!override) continue
        for (const key of Object.keys(override)) {
            const val = (override as any)[key]
            if (
                val !== undefined &&
                typeof val === 'object' &&
                val !== null &&
                !Array.isArray(val)
            ) {
                result[key] = deepMerge(result[key] || {}, val)
            } else if (val !== undefined) {
                result[key] = val
            }
        }
    }

    return result
}
