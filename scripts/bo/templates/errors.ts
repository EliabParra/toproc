/**
 * Generador de plantillas para archivos Errors.ts de BO
 * Contiene clases de error personalizadas y utilidades de manejo de errores
 */

/**
 * Genera el contenido del archivo Errors.ts para un Business Object
 *
 * @param objectName - Nombre del objeto (ej: "Product")
 * @param _methods - Lista de métodos del BO (no usado actualmente)
 * @returns Contenido del archivo Errors.ts generado
 */
export function templateErrors(objectName: string, _methods: string[]) {
    const cleanName = objectName.replace(/BO$/, '')
    const pascalName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1)
    const lowerName = cleanName.toLowerCase()
    const upperName = cleanName.toUpperCase()

    return `/**
 * Clases de Error Personalizadas para ${pascalName} Business Object
 *
 * Usa errores específicos del dominio en lugar de genéricos para:
 * - Mejor manejo y recuperación de errores
 * - Respuestas de API más claras
 * - Depuración más fácil
 */

import { BOError, TxKey } from '../../src/core/business-objects/index.js'
import { ${pascalName}Messages } from './${pascalName}Module.js'

const defaultMessages = ${pascalName}Messages.es

// ============================================================
// Clase Base de Error
// ============================================================

/**
 * Clase base de error para el dominio ${pascalName}
 * Extiende BOError con código y status HTTP
 */
export class ${pascalName}Error extends BOError {
    constructor(
        message: TxKey | (string & {}),
        tag: string,
        code: number = 500,
        details?: Record<string, unknown>
    ) {
        super(message, tag, code, details)
        this.name = '${pascalName}Error';
    }
}

// ============================================================
// Clases de Error Específicas
// ============================================================

/**
 * Lanzado cuando la entidad ${pascalName} no se encuentra
 */
export class ${pascalName}NotFoundError extends ${pascalName}Error {
    constructor(id?: number) {
        super(defaultMessages.notFound, '${upperName}_NOT_FOUND', 404, id ? { id } : undefined)
        this.name = '${pascalName}NotFoundError'
    }
}

/**
 * Lanzado cuando se detecta un ${pascalName} duplicado
 */
export class ${pascalName}AlreadyExistsError extends ${pascalName}Error {
    constructor(field?: string, value?: string) {
        super(defaultMessages.alreadyExists, '${upperName}_ALREADY_EXISTS', 409, { field, value })
        this.name = '${pascalName}AlreadyExistsError'
    }
}

/**
 * Lanzado cuando falla la validación de datos de ${pascalName}
 */
export class ${pascalName}ValidationError extends ${pascalName}Error {
    readonly validationErrors: string[]

    constructor(errors: string[]) {
        super(defaultMessages.invalidData, '${upperName}_VALIDATION_ERROR', 400, { errors })
        this.name = '${pascalName}ValidationError'
        this.validationErrors = errors
    }
}

/**
 * Lanzado cuando ${pascalName} no puede ser eliminado (ej: tiene dependencias)
 */
export class ${pascalName}CannotDeleteError extends ${pascalName}Error {
    constructor(reason?: string) {
        super(
            defaultMessages.cannotDelete,
            '${upperName}_CANNOT_DELETE',
            409,
            { reason }
        )
        this.name = '${pascalName}CannotDeleteError'
    }
}

/**
 * Lanzado cuando el usuario no tiene permiso para la operación de ${pascalName}
 */
export class ${pascalName}PermissionError extends ${pascalName}Error {
    constructor(action?: string) {
        super(
            defaultMessages.permissionDenied,
            '${upperName}_PERMISSION_DENIED',
            403,
            { action }
        )
        this.name = '${pascalName}PermissionError'
    }
}

// ============================================================
// Utilidad de Manejo de Errores
// ============================================================

/**
 * Convierte errores desconocidos a ${pascalName}Error
 * Usar en bloques catch para manejo de errores consistente
 *
 * @example
 * try {
 *     await this.service.create(data)
 * } catch (error) {
 *     throw handle${pascalName}Error(error)
 * }
 */
export function handle${pascalName}Error(error: unknown): ${pascalName}Error {
    // Ya es un ${pascalName}Error, retornar tal cual
    if (error instanceof ${pascalName}Error) {
        return error
    }

    // Error estándar, envolverlo
    if (error instanceof Error) {
        return new ${pascalName}Error(
            defaultMessages.invalidData,
            '${upperName}_UNKNOWN_ERROR',
            500,
            { originalError: error.name, message: error.message }
        )
    }

    // Tipo desconocido, crear error genérico
    return new ${pascalName}Error(
        defaultMessages.invalidData,
        '${upperName}_UNKNOWN_ERROR',
        500
    )
}

// ============================================================
// Type Guards
// ============================================================

/**
 * Type guard para verificar si un error es ${pascalName}Error
 */
export function is${pascalName}Error(error: unknown): error is ${pascalName}Error {
    return error instanceof ${pascalName}Error
}

/**
 * Type guard para errores de no encontrado
 */
export function is${pascalName}NotFound(error: unknown): error is ${pascalName}NotFoundError {
    return error instanceof ${pascalName}NotFoundError
}
`
}
