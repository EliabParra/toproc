export interface ILogger {
    TYPE_ERROR: number
    TYPE_INFO: number
    TYPE_DEBUG: number
    TYPE_WARNING: number
    show(params: { type: number; msg?: unknown; ctx?: unknown } | string): void
}

export interface IValidator {
    validate<T>(
        data: unknown,
        schema: unknown
    ): { valid: boolean; data?: T; errors?: { path: string; message: string }[] }
    // Legacy support
    getAlerts?(): string[]
    // Legacy methods
    validateString?(opts: any): boolean
    validateLength?(opts: any, min: number, max: number): boolean
    validateEmail?(opts: any): boolean
}

export interface II18nService {
    t(key: string, props?: Record<string, unknown>): string
}

export interface IDatabase {
    exe(schema: string, query: string, params?: unknown): Promise<{ rows: any[]; rowCount: number }> // Simplified QueryResult
    exeRaw(sql: string, params?: unknown): Promise<{ rows: any[]; rowCount: number }>
    exeNamed(
        schema: string,
        query: string,
        paramsObj: unknown,
        orderKeys: unknown[],
        opts?: { strict?: boolean; enforceSqlArity?: boolean }
    ): Promise<{ rows: any[]; rowCount: number }>
}

export interface IConfig {
    app: {
        port: number
        host: string
        name: string
        lang: string
        frontendMode: string
        trustProxy?: number | boolean | string
    }
    db: any
    session: any
    cors: any
    bo: {
        path: string
    }
    log: any
    auth: any
    email: any
}

export interface ISecurityService {
    isReady: boolean
    ready: Promise<boolean>
    getDataTx(tx: unknown): { object_na: string; method_na: string } | false
    getPermissions(data: { profile_id: number; method_na: string; object_na: string }): boolean
    executeMethod(data: {
        object_na: string
        method_na: string
        params: any
    }): Promise<{ code: number; msg: string; [key: string]: any }>
}

export interface ISessionService {
    sessionExists(req: any): boolean
    createSession(req: any, res: any): Promise<any>
    destroySession(req: any): void
}

export interface IEmailService {
    sendLoginChallenge(params: {
        to: string
        token: string
        code: string
        appName?: unknown
    }): Promise<{ ok: boolean; mode: string }>
    sendPasswordReset(params: {
        to: string
        token: string
        code: string
        appName?: unknown
    }): Promise<{ ok: boolean; mode: string }>
    sendEmailVerification(params: {
        to: string
        token: string
        code: string
        appName?: unknown
    }): Promise<{ ok: boolean; mode: string }>
    maskEmail(email: string): string
}

// Result of dependency injection resolution
export interface IContainer {
    resolve<T>(key: string): T
}

export interface IAuditService {
    log(
        req: any,
        args: {
            action: string
            object_na?: string | null
            method_na?: string | null
            tx?: unknown
            user_id?: number | null
            profile_id?: number | null
            details?: Record<string, unknown>
        }
    ): Promise<void>
}
