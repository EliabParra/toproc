// Core types for DB CLI

export interface InitConfig {
    app: AppConfig
    db: DbConfig
    auth: AuthConfig
    security: SecurityConfig
}

export interface AppConfig {
    interactive: boolean
    dryRun: boolean
    silent: boolean
    profile: string
}

export interface DbConfig {
    host?: string
    port?: number
    database?: string
    user?: string
    password?: string
    ssl?: boolean
    connectionString?: string
}

export interface AuthConfig {
    enabled?: boolean
    usernameSupported?: boolean
    loginId?: 'email' | 'username'
    login2StepNewDevice?: boolean
    publicProfileId?: number
    sessionProfileId?: number
}

export interface SecurityConfig {
    seedAdmin?: boolean
    adminUser?: string
    adminPassword?: string
    adminProfileId?: number

    seedProfiles?: boolean
    publicProfileId?: number
    sessionProfileId?: number

    registerBo?: boolean
    txStart?: number
    pruneMethods?: boolean
    introspectData?: boolean // New option

    seedPublicAuthPerms?: boolean
    includeEmail?: boolean
    sessionSchema?: string
    sessionTable?: string
}

/**
 * Partial configuration for CLI arguments override
 */
export type PartialInitConfig = {
    [P in keyof InitConfig]?: Partial<InitConfig[P]>
}

export interface SchemaFile {
    path: string
    name: string
}
