export type EnvType = 'development' | 'production' | 'testing'

export interface DbConfig {
    connectionString?: string
    host?: string
    port?: number
    database?: string
    user?: string
    password?: string
    ssl?: boolean
}

export interface AuthConfig {
    enabled: boolean
    usernameSupported: boolean
    loginId: 'email' | 'username'
    login2StepNewDevice: boolean
    publicProfileId: number
    sessionProfileId: number
    seedProfiles: boolean
    seedPublicAuthPerms: boolean
}

export interface SecurityConfig {
    adminUser: string
    adminPass: string
    generatePass: boolean
    profileId: number
    sessionSchema: string
    sessionTable: string
    includeEmail: boolean
}

export interface AppConfig {
    profile: EnvType
    interactive: boolean
    dryRun: boolean
    silent: boolean
    rootDir: string
}

export interface InitConfig {
    app: AppConfig
    db: DbConfig
    auth: AuthConfig
    security: SecurityConfig
    // Future extensions can go here
}

export const DEFAULT_CONFIG: InitConfig = {
    app: {
        profile: 'development',
        interactive: true,
        dryRun: false,
        silent: false,
        rootDir: process.cwd(),
    },
    db: {
        host: 'localhost',
        port: 5432,
        user: 'postgres',
        database: 'postgres',
    },
    auth: {
        enabled: false,
        usernameSupported: true,
        loginId: 'email',
        login2StepNewDevice: false,
        publicProfileId: 999,
        sessionProfileId: 1,
        seedProfiles: true,
        seedPublicAuthPerms: false,
    },
    security: {
        adminUser: 'admin',
        adminPass: '',
        generatePass: true,
        profileId: 1,
        sessionSchema: 'security',
        sessionTable: 'sessions',
        includeEmail: false,
    },
}

// Helper type for recursive partials (simplified)
type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export const PROFILES: Record<EnvType, DeepPartial<InitConfig>> = {
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
