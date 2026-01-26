import {
    IDatabase as CoreDatabase,
    ILogger as CoreLogger,
    IEmailService as CoreEmail,
    IValidator as CoreValidator,
} from '../../types/core.js'

/**
 * Re-exportación de interfaces Core para compatibilidad y unificación.
 * Evita la duplicidad de tipos entre services.ts y types/core.ts.
 */

export type IDatabaseService = CoreDatabase
export type ILogger = CoreLogger
export type IEmailService = CoreEmail

// IValidator en services.ts tenía métodos legacy específicos.
// Extendemos la interfaz CoreValidator para mantener compatibilidad si es necesario,
// pero idealmente deberíamos migrar a la interfaz unificada.
export interface IValidator extends CoreValidator {
    validateString?(param: any): boolean
    validateInt?(param: any): boolean
    validateEmail?(param: any): boolean
    // getAlerts ya está en CoreValidator como opcional
    validate(value: any, type: string): any // Overload conflict potential, making flexible
}
