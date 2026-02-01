/**
 * Error base para la capa de Business Objects.
 * Estandariza el manejo de errores con códigos HTTP y tags para logging/métricas.
 */
export class BOError extends Error {
    readonly tag: string
    readonly code: number
    readonly details?: Record<string, unknown>

    constructor(
        message: string,
        tag: string,
        code: number = 500,
        details?: Record<string, unknown>
    ) {
        super(message)
        this.name = 'BOError'
        this.tag = tag
        this.code = code
        this.details = details

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, BOError)
        }
    }

    toJSON() {
        return {
            name: this.name,
            message: this.message,
            tag: this.tag,
            code: this.code,
            details: this.details,
        }
    }
}

/**
 * Type guard para verificar si un error es un BOError.
 */
export function isBOError(error: unknown): error is BOError {
    return error instanceof BOError
}
