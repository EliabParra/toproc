/**
 * Tipos de Respuesta API
 *
 * Tipos compartidos para respuestas HTTP y mensajes localizados.
 *
 * @module types/api
 */

/**
 * Mensaje localizado con código HTTP y texto.
 * Usado para errores del cliente, errores del servidor y mensajes de éxito.
 */
export interface LocalizedMessage {
    code: number
    msg: string
}

/**
 * Mapa de mensajes localizados indexado por clave.
 *
 * @example
 * ```typescript
 * const errors: LocalizedMessages = {
 *     login: { code: 401, msg: 'Debe iniciar sesión' },
 *     permissionDenied: { code: 403, msg: 'Permiso denegado' },
 * }
 * ```
 */
export type LocalizedMessages = Record<string, LocalizedMessage>

/**
 * Respuesta API estándar.
 *
 * @template T - Tipo de los datos de respuesta
 */
export interface ApiResponse<T = unknown> {
    /** Código HTTP (200, 400, 401, 403, 500, etc.) */
    code: number
    /** Mensaje descriptivo */
    msg: string
    /** Datos de respuesta (opcional) */
    data?: T | null
    /** Alertas de validación (opcional) */
    alerts?: string[]
    /** Errores estructurados de validación (opcional) */
    errors?: ValidationError[]
}

/**
 * Respuesta de éxito (código 2xx).
 */
export interface ApiSuccess<T = unknown> extends ApiResponse<T> {
    code: 200 | 201
    data: T
}

/**
 * Respuesta de error (código 4xx o 5xx).
 */
export interface ApiError extends ApiResponse<null> {
    code: 400 | 401 | 403 | 404 | 500
    data: null
    alerts: string[]
    errors?: ValidationError[]
}

/**
 * Error de validación individual.
 */
export interface ValidationError {
    /** Ruta del campo (e.g. 'user.email') */
    path: string
    /** Mensaje de error */
    message: string
    /** Código de error (opcional) */
    code?: string
}

/**
 * Resultado de validación exitosa.
 */
export interface ValidationSuccess<T> {
    valid: true
    data: T
}

/**
 * Resultado de validación fallida.
 */
export interface ValidationFailure {
    valid: false
    errors: ValidationError[]
    alerts?: string[]
}

/**
 * Resultado de validación (unión discriminada).
 */
export type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure
