import { IDatabase, ILogger, IConfig, IValidator, II18nService } from '../../types/core.js'
import { ApiResponse } from '../response/ApiResponse.js'

export type BODependencies = {
    db: IDatabase
    log: ILogger
    config: IConfig
    v: IValidator
    i18n?: II18nService
    msgs?: any // Legacy messages support
}

export abstract class BaseBO {
    protected readonly db: IDatabase
    protected readonly log: ILogger
    protected readonly config: IConfig
    protected readonly v: IValidator
    protected readonly i18n?: II18nService
    protected readonly msgs?: any

    constructor(deps: BODependencies) {
        this.db = deps.db
        this.log = deps.log
        this.config = deps.config
        this.v = deps.v
        this.i18n = deps.i18n
        this.msgs = deps.msgs
    }

    protected success<T>(data: T, msg = 'OK'): ApiResponse<T> {
        return { code: 200, msg, data }
    }

    protected created<T>(data: T, msg = 'Created'): ApiResponse<T> {
        return { code: 201, msg, data }
    }

    protected error(msg: string, code = 500, alerts: string[] = []): ApiResponse {
        return { code, msg, alerts }
    }

    protected validationError(alerts?: string[]): ApiResponse {
        // Use provided alerts, or try to get legacy alerts if available
        const finalAlerts = alerts ?? (this.v.getAlerts ? this.v.getAlerts() : ['Validation Error'])
        return { code: 400, msg: 'Validation Error', alerts: finalAlerts }
    }

    /**
     * Helper to run validation using AppValidator (Zod).
     * Returns the parsed data if valid, or throws/returns alerts.
     * To make it easy to use with imperative returns, it returns a Result object.
     */
    protected validate<T>(
        data: unknown,
        schema: any
    ): { ok: true; data: T } | { ok: false; alerts: string[] } {
        const result = this.v.validate<T>(data, schema)
        if (result.valid && result.data) {
            return { ok: true, data: result.data }
        }

        // Map errors to simple strings for now (Legacy Alert format)
        // In clean architecture, we might want structured errors, but UI expects strings map/array.
        const alerts = result.errors?.map((e: { message: string }) => e.message) || [
            'Unknown validation error',
        ]
        return { ok: false, alerts }
    }
}
