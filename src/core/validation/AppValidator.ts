import { z, ZodSchema, ZodError } from 'zod'
import { ValidationResult, ValidationError } from './types.js'
import { I18nService } from '../i18n/I18nService.js'

/**
 * Servicio de validación moderno usando esquemas Zod con soporte i18n.
 *
 * AppValidator proporciona validación type-safe con mensajes de error localizados.
 * Se integra con el mapa de errores de Zod para producir alertas amigables
 * basadas en la configuración i18n de la aplicación.
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
 *     email: z.string().email(),
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
        this.setupErrorMap()
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
     *     email: z.string().email()
     * })
     *
     * const result = validator.validate(req.body, CreateUserSchema)
     *
     * if (result.valid) {
     *     // TypeScript sabe que result.data es { name: string, email: string }
     *     await userService.create(result.data)
     * } else {
     *     // result.errors contiene mensajes localizados
     *     return res.status(400).json({ alerts: result.errors.map(e => e.message) })
     * }
     * ```
     */
    validate<T>(data: unknown, schema: ZodSchema<T>): ValidationResult<T> {
        const result = schema.safeParse(data)

        if (result.success) {
            return { valid: true, data: result.data }
        }

        // ZodError issues es la fuente de verdad para safeParse
        const issues = (result.error as any).issues || (result.error as any).errors || []
        const errors: ValidationError[] = issues.map((err: any) => {
            let p = ''
            try {
                if (Array.isArray(err.path)) p = err.path.join('.')
                else if (typeof err.path === 'string') p = err.path
            } catch {}

            return {
                path: p,
                message: err.message || 'Error',
                code: err.code,
            }
        })

        return { valid: false, errors }
    }

    /**
     * Configura el mapa de errores global de Zod para usar i18n con mensajes localizados.
     *
     * Mapea códigos de issue de Zod a claves de alerta i18n:
     * - `invalid_type` → `alerts.notEmpty`, `alerts.{type}`
     * - `invalid_format` (email) → `alerts.email`
     * - `too_small` → `alerts.lengthMin`
     * - `too_big` → `alerts.lengthMax`
     *
     * @private
     */
    private setupErrorMap() {
        // @ts-ignore: Bypass de incompatibilidad de tipos Zod para firma del callback
        z.setErrorMap((issue: any, ctx: any) => {
            const i = issue as any
            let message = ctx?.defaultError || i.message || 'Entrada inválida'
            const pathStr = i.path?.join('.') || ''

            // Mapear issues de Zod a claves I18n

            if (i.code === z.ZodIssueCode.invalid_type) {
                if (i.received === 'undefined' || i.received === 'null') {
                    message = this.i18n.t('alerts.notEmpty', { value: pathStr })
                } else {
                    if (
                        ['string', 'number', 'boolean', 'array', 'object', 'date'].includes(
                            i.expected
                        )
                    ) {
                        message = this.i18n.t(`alerts.${i.expected}`, { value: pathStr })
                    }
                }
            }

            // Manejar validaciones de email
            if (i.code === 'invalid_format' && i.format === 'email') {
                message = this.i18n.t('alerts.email', { value: pathStr })
            }

            if (i.code === z.ZodIssueCode.too_small && i.type === 'string') {
                message = this.i18n.t('alerts.lengthMin', { value: pathStr, min: i.minimum })
            }

            if (i.code === z.ZodIssueCode.too_big && i.type === 'string') {
                message = this.i18n.t('alerts.lengthMax', { value: pathStr, max: i.maximum })
            }

            return { message }
        })
    }
}
