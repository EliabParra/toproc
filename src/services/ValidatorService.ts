import { ZodType } from 'zod'
import type { IValidator, ValidationResult, ValidationError, II18nService } from '../types/index.js'

// Interface compatible with ZodIssue to avoid strict type mismatch issues
interface ZodIssueCompatible {
    code: string
    path: (string | number)[]
    message: string
    expected?: string
    received?: string
    minimum?: number
    maximum?: number
    type?: string
    validation?: string
    format?: string
}

/**
 * Servicio de validación unificado que implementa `IValidator`.
 * Utiliza Zod para la validación de esquemas y I18nService para la localización de mensajes.
 *
 * Reemplaza al antiguo `AppValidator` proporcionando una implementación más robusta
 * y estandarizada dentro de la capa de servicios.
 *
 * @class ValidatorService
 * @implements {IValidator}
 */
export class ValidatorService implements IValidator {
    /**
     * Crea una nueva instancia de ValidatorService.
     *
     * @param i18n - Servicio de internacionalización para traducir mensajes de error.
     */
    constructor(private i18n: II18nService) {}

    /**
     * Valida datos arbitrarios contra un esquema Zod.
     *
     * Retorna un resultado tipado que indica éxito o fallo, con mensajes de error
     * traducidos automáticamente según el idioma configurado.
     *
     * @template T - Tipo de dato esperado al validar exitosamente.
     * @param data - Datos crudos a validar (ej. body de un request).
     * @param schema - Esquema Zod que define la estructura y reglas.
     * @returns {ValidationResult<T>} Objeto con propiedad `valid` y datos o errores.
     *
     * @example
     * ```typescript
     * const schema = z.object({ email: z.string().email() });
     * const result = validator.validate(body, schema);
     *
     * if (result.valid) {
     *   // result.data está tipado correctamente
     *   process(result.data.email);
     * } else {
     *   // result.errors contiene array de ValidationError
     *   console.error(result.errors);
     * }
     * ```
     */
    public validate<T>(data: unknown, schema: ZodType): ValidationResult<T> {
        // Usamos safeParse estándar de Zod
        const result = schema.safeParse(data)

        if (result.success) {
            return { valid: true, data: result.data as T }
        }

        // Mapeo detallado de errores delegando a método especializado
        const errors: ValidationError[] = result.error.issues.map((issue) =>
            this.mapZodIssue(issue as ZodIssueCompatible)
        )

        return { valid: false, errors }
    }

    /**
     * Transforma un error de Zod en un ValidationError de nuestra aplicación.
     * Encapsula la lógica de resolución de mensajes y formateo de rutas.
     *
     * @param issue - El error crudo de Zod
     */
    private mapZodIssue(issue: ZodIssueCompatible): ValidationError {
        const pathStr = issue.path.join('.') || 'root'
        let message = issue.message

        // Intentar resolver mensaje localizado con nuestra lógica custom
        const localized = this.resolveLocalizedError(issue)

        if (localized) {
            message = localized
        } else {
            // Fallback: traducir el mensaje por defecto si es posible
            message = this.i18n.translate(message)
        }

        return {
            path: pathStr,
            message: message,
            code: issue.code,
        }
    }

    /**
     * Extrae una lista simple de mensajes de alerta de los errores de validación.
     * Útil para mostrar tostadas o mensajes flash en el frontend.
     *
     * @param errors - Array de errores de validación.
     * @returns Array de strings con los mensajes.
     */
    public getAlerts(errors: ValidationError[]): string[] {
        return errors.map((e) => e.message)
    }

    /**
     * Formatea un mensaje con parámetros.
     * Mantenido para compatibilidad con la interfaz IValidator anterior.
     *
     * @param msg - Clave del mensaje o texto.
     * @param args - Parámetros para la interpolación.
     */
    public format(msg: string, ...args: unknown[]): string {
        const params =
            args.length > 0 && typeof args[0] === 'object'
                ? (args[0] as Record<string, unknown>)
                : undefined
        return this.i18n.format(msg, params)
    }

    /**
     * Resuelve un mensaje de error localizado basado en el código de error de Zod.
     * Utiliza las alertas configuradas en el servicio de i18n.
     *
     * @param issue - Objeto de error interno de Zod.
     * @returns El mensaje traducido o null si no se encuentra.
     */
    private resolveLocalizedError(issue: ZodIssueCompatible): string | null {
        try {
            // Definición de tipos para las alertas esperadas
            interface AlertMessages {
                string?: string
                number?: string
                lengthMin?: string
                lengthMax?: string
                email?: string
                notEmpty?: string
                [key: string]: string | undefined
            }

            // Acceso seguro a los mensajes de alertas
            const alertMessages = this.i18n.messages.alerts as AlertMessages
            if (!alertMessages) return null

            const pathStr = issue.path.join('.') || ''

            // Mapeo según código de error Zod
            if (issue.code === 'invalid_type') {
                // Caso especial para campos requeridos faltantes
                if (issue.received === 'undefined' || issue.received === 'null') {
                    return this.i18n.format(alertMessages.notEmpty || 'Required', { value: pathStr })
                }

                const realIssue = issue as { expected?: string }
                if (realIssue.expected && alertMessages[realIssue.expected]) {
                    return this.i18n.format(alertMessages[realIssue.expected]!, { value: pathStr })
                }

                // Fallback genérico para tipos inválidos
                return this.i18n.translate('errors.client.invalidParameters.msg')
            }

            if (issue.code === 'too_small') {
                return this.i18n.format(alertMessages.lengthMin || 'Too short', {
                    value: pathStr,
                    min: issue.minimum,
                })
            }

            if (issue.code === 'too_big') {
                return this.i18n.format(alertMessages.lengthMax || 'Too long', {
                    value: pathStr,
                    max: issue.maximum,
                })
            }

            if (issue.code === 'invalid_string') {
                const realIssue = issue as { validation?: string }
                if (realIssue.validation === 'email') {
                    return this.i18n.format(alertMessages.email || 'Invalid email', { value: pathStr })
                }
            }

            if (issue.code === 'invalid_format' && issue.format === 'email') {
                return this.i18n.format(alertMessages.email || 'Invalid email', { value: pathStr })
            }

            return null
        } catch (e) {
            // En caso de cualquier error de resolución, retornamos null para usar el fallback
            return null
        }
    }
}
