/**
 * Generador de plantillas para archivos errors.ts de BO
 * Contiene clases de error personalizadas y utilidades de manejo de errores
 */

/**
 * Genera el contenido del archivo errors.ts para un Business Object
 *
 * @param objectName - Nombre del objeto (ej: "Product")
 * @param _methods - Lista de métodos del BO (no usado actualmente)
 * @returns Contenido del archivo errors.ts generado
 */
export function templateErrors(objectName: string, _methods: string[]) {
    const cleanName = objectName.replace(/BO$/, '')
    const pascalName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1)
    const upperName = cleanName.toUpperCase()

    return `/**
 * Clases de Error Personalizadas para ${pascalName} Business Object
 * 
 * Usa errores específicos del dominio en lugar de genéricos para:
 * - Mejor manejo y recuperación de errores
 * - Respuestas de API más claras
 * - Depuración más fácil
 */

import { ${pascalName}Messages } from './${pascalName}.Messages.js'

// ============================================================
// Clase Base de Error
// ============================================================

/**
 * Clase base de error para el dominio ${pascalName}
 * Extiende Error estándar con código y status HTTP
 */
import { BOError } from '../../src/core/errors/BOError.js'
import { ${pascalName}Messages } from './${pascalName}.Messages.js'

// ============================================================
// Clase Base de Error
// ============================================================

/**
 * Clase base de error para el dominio ${pascalName}
 * Extiende BOError con código y status HTTP
 */
export class ${pascalName}Error extends BOError {
    constructor(
        message: string,
        code: string,
        status: number = 500,
        details?: Record<string, unknown>
    ) {
        // Tag format example: PRODUCT_ERROR
        super(message, '${upperName}_ERROR', status, details)
        this.name = '${pascalName}Error'
        // Override code with the specific string code from generic BOError number code if needed, 
        // but BOError primarily uses number. We can map string code to tag or details if we want strict compatibility.
        // For this template, we'll keep the custom properties but extend BOError.
        (this as any).codeString = code 
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
        const message = id 
            ? ${pascalName}Messages.notFoundById(id)
            : ${pascalName}Messages.NOT_FOUND
        super(message, '${upperName}_NOT_FOUND', 404, id ? { id } : undefined)
        this.name = '${pascalName}NotFoundError'
    }
}

/**
 * Lanzado cuando se detecta un ${pascalName} duplicado
 */
export class ${pascalName}AlreadyExistsError extends ${pascalName}Error {
    constructor(field?: string, value?: string) {
        const message = field && value
            ? ${pascalName}Messages.duplicateField(field, value)
            : ${pascalName}Messages.ALREADY_EXISTS
        super(message, '${upperName}_ALREADY_EXISTS', 409, { field, value })
        this.name = '${pascalName}AlreadyExistsError'
    }
}

/**
 * Lanzado cuando falla la validación de datos de ${pascalName}
 */
export class ${pascalName}ValidationError extends ${pascalName}Error {
    readonly validationErrors: string[]

    constructor(errors: string[]) {
        super(${pascalName}Messages.INVALID_DATA, '${upperName}_VALIDATION_ERROR', 400, { errors })
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
            reason || ${pascalName}Messages.CANNOT_DELETE,
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
            ${pascalName}Messages.PERMISSION_DENIED,
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
            error.message,
            '${upperName}_UNKNOWN_ERROR',
            500,
            { originalError: error.name }
        )
    }

    // Tipo desconocido, crear error genérico
    return new ${pascalName}Error(
        'Error desconocido en ${pascalName}',
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
