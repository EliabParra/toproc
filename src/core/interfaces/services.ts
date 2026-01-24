export interface IDatabaseService {
    exe(schema: string, query: string, params?: unknown): Promise<{ rows: any[]; rowCount: number }>
    exeRaw(sql: string, params?: unknown): Promise<{ rows: any[]; rowCount: number }>
    exeNamed(
        schema: string,
        query: string,
        paramsObj: unknown,
        orderKeys: unknown[],
        opts?: { strict?: boolean; enforceSqlArity?: boolean }
    ): Promise<{ rows: any[]; rowCount: number }>
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

export interface ILogger {
    TYPE_ERROR: number
    TYPE_INFO: number
    TYPE_DEBUG: number
    TYPE_WARNING: number
    show(params: { type: number; msg?: unknown; ctx?: unknown } | string): void
}

export interface IValidator {
    validateString(param: any): boolean
    validateInt(param: any): boolean
    validateEmail(param: any): boolean
    getAlerts(): string[]
    // Add other methods as needed from Validator.ts
    validate(value: any, type: string): boolean
}
