export class DomainError extends Error {
    public code: number
    public alerts: string[]

    constructor(message: string, code: number = 500, alerts: string[] = []) {
        super(message)
        this.name = 'DomainError'
        this.code = code
        this.alerts = alerts
    }

    static invalidParameters(alerts: string[] = []): DomainError {
        return new DomainError('Invalid parameters', 400, alerts)
    }

    static notFound(message = 'Resource not found'): DomainError {
        return new DomainError(message, 404)
    }

    static unauthorized(message = 'Unauthorized'): DomainError {
        return new DomainError(message, 401)
    }
}
