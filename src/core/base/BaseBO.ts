import { IDatabaseService, ILogger, IValidator } from '../interfaces/services.js'
import { ApiResponse } from '../response/ApiResponse.js'

export type BODependencies = {
    db: IDatabaseService
    log: ILogger
    v: IValidator
    config?: any
}

export abstract class BaseBO {
    protected readonly db: IDatabaseService
    protected readonly log: ILogger
    protected readonly v: IValidator
    protected readonly config: any

    constructor(deps: BODependencies) {
        this.db = deps.db
        this.log = deps.log
        this.v = deps.v
        this.config = deps.config
    }

    protected success<T>(data: T, msg = 'OK'): ApiResponse<T> {
        return { code: 200, msg, data }
    }

    protected error(msg: string, code = 500, alerts: string[] = []): ApiResponse {
        return { code, msg, alerts }
    }

    protected validationError(alerts?: string[]): ApiResponse {
        return { code: 400, msg: 'Validation Error', alerts: alerts ?? this.v.getAlerts() } // Uses validator alerts if none passed
    }
}
