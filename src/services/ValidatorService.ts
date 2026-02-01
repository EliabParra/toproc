import { z, ZodType } from 'zod'
import { ValidationResult, ValidationError } from '../types/Validation.js'
import { I18nService } from './I18nService.js'

// Define a robust interface compatible with the installed Zod version's output
interface ZodIssueCompatible {
    code: string
    path: (string | number)[]
    message?: string
    expected?: string
    received?: string
    minimum?: number
    maximum?: number
    type?: string
    validation?: string
    format?: string // For invalid_format
}

/**
 * Servicio de validación moderno usando esquemas Zod con soporte i18n.
 *
 * AppValidator proporciona validación type-safe con mensajes de error localizados.
 * Se integra con el mapa de errores de Zod para producir alertas amigables
 *
 * @example
 * ```typescript
 * import { z } from 'zod'
 * import { AppValidator } from './core/validation/AppValidator.js'
 * import { I18nService } from './core/i18n/I18nService.js'
 *
 * const i18n = new I18nService(messagesJson, 'es')
 * const validator = new AppValidator(i18n)
 *
 * const UserSchema = z.object({
 *     email: z.email(),
 *     age: z.number().min(18)
 * })
 *
 * const result = validator.validate({ email: 'invalid', age: 15 }, UserSchema)
 * if (!result.valid) {
 *     console.log(result.errors) // Mensajes de error localizados
 * }
 * ```
 */
export class AppValidator {
    /** Servicio i18n para mensajes de error localizados */
    private i18n: I18nService

    /**
     * Crea una nueva instancia de AppValidator.
     *
     * Configura automáticamente el mapa de errores de Zod para usar i18n en todos los errores de validación.
     *
     * @param i18n - Instancia de I18nService para localización de mensajes
     */
    constructor(i18n: I18nService) {
        this.i18n = i18n
    }

    /**
     * Valida datos contra un esquema Zod.
     *
     * Retorna un resultado de unión discriminada:
     * - En éxito: `{ valid: true, data: T }` con datos parseados y tipados
     * - En fallo: `{ valid: false, errors: ValidationError[] }` con mensajes localizados
     *
     * @template T - El tipo esperado después de validación exitosa
     * @param data - Datos de entrada crudos a validar (típicamente del body de request)
     * @param schema - Esquema Zod definiendo la estructura esperada
     * @returns ValidationResult conteniendo datos parseados o errores de validación
     *
     * @example
     * ```typescript
     * const CreateUserSchema = z.object({
     *     name: z.string().min(2),
     *     email: z.email()
     * })
     *
     * const result = validator.validate(req.body, CreateUserSchema)
     *
     * if (result.valid) {
     *     // TypeScript sabe que result.data es { name: string, email: string }
     *     await userService.create(result.data)
     * } else {
     */
    /**
     * Valida datos contra un esquema Zod.
     *
     * Retorna un resultado de unión discriminada:
     * - En éxito: `{ valid: true, data: T }` con datos parseados y tipados
     * - En fallo: `{ valid: false, errors: ValidationError[] }` con mensajes localizados
     *
     * @template T - El tipo esperado después de validación exitosa
     * @param data - Datos de entrada crudos a validar (típicamente del body de request)
     * @param schema - Esquema Zod definiendo la estructura esperada
     * @returns ValidationResult conteniendo datos parseados o errores de validación
     *
     * @example
     * ```typescript
     * const CreateUserSchema = z.object({
     *     name: z.string().min(2),
     *     email: z.email()
     * })
     *
     * const result = validator.validate(req.body, CreateUserSchema)
     *
     * if (result.valid) {
     *     // TypeScript sabe que result.data es { name: string, email: string }
     *     await userService.create(result.data)
     * } else {
     */
    validate<T>(data: unknown, schema: ZodType): ValidationResult<T> {
        // Standard safeParse without options (since errorMap is ignored in this version)
        const result = schema.safeParse(data)
        const resultData = result.data as T

        if (result.success) return { valid: true, data: resultData }

        const issues = result.error.issues
        const errors: ValidationError[] = issues.map((zodIssue) => {
            // Apply our custom localization logic manually to each issue
            const issue = zodIssue as ZodIssueCompatible
            const pathStr = issue.path.join('.') || ''

            // Default message from Zod if we don't match anything
            let message = issue.message || 'Error'

            // Try to resolve a localized message
            const localized = this.resolveLocalizedError(issue)
            if (localized) {
                message = localized
            } else {
                // Fallback: translate the default message if possible (legacy behavior)
                message = this.i18n.t(message)
            }

            return {
                path: pathStr,
                message: message,
                code: issue.code,
            }
        })

        return { valid: false, errors }
    }

    getAlerts(errors: ValidationError[]) {
        const alerts: string[] = []
        errors.forEach((error) => {
            alerts.push(error.message)
        })
        return alerts
    }

    /**
     * Resuelve el mensaje de error localizado basado en el issue de Zod
     */
    private resolveLocalizedError(issue: ZodIssueCompatible): string | null {
        const msgs = this.i18n.messages.alerts
        const pathStr = issue.path?.join('.') || ''

        if (issue.code === 'invalid_type') {
            if (issue.received === 'undefined' || issue.received === 'null') {
                return this.i18n.format(msgs.notEmpty, { value: pathStr })
            } else {
                const typeMsg = msgs[issue.expected as keyof typeof msgs]
                if (typeMsg) {
                    return this.i18n.format(typeMsg, { value: pathStr })
                }
            }
        }

        if (issue.code === 'invalid_format' && issue.format === 'email') {
            return this.i18n.format(msgs.email, { value: pathStr })
        }

        if (issue.code === 'invalid_string' && issue.validation === 'email') {
            return this.i18n.format(msgs.email, { value: pathStr })
        }

        if (issue.code === 'too_small' && issue.type === 'string') {
            return this.i18n.format(msgs.lengthMin, {
                value: pathStr,
                min: issue.minimum,
            })
        }

        if (issue.code === 'too_big' && issue.type === 'string') {
            return this.i18n.format(msgs.lengthMax, {
                value: pathStr,
                max: issue.maximum,
            })
        }

        return null
    }
}
