import type { TxKey } from '../../types/core.js'

/**
 * Error base para la capa de Business Objects.
 * Estandariza el manejo de errores con códigos HTTP y tags para logging/métricas.
 */
export class BOError extends Error {
    /** Clave i18n o mensaje legible para el usuario */
    readonly key: TxKey | (string & {})
    /** Identificador estable para métricas/observabilidad */
    readonly tag: string
    /** Código HTTP asociado */
    readonly code: number
    /** Detalles adicionales del error (no expuestos al cliente por defecto) */
    readonly details?: Record<string, unknown>

    constructor(
        key: TxKey | (string & {}),
        tag: string,
        code: number = 500,
        details?: Record<string, unknown>
    ) {
        super(String(key))
        this.name = 'BOError'
        this.key = key
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
            key: this.key,
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
