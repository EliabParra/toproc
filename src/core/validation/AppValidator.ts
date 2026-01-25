import { z, ZodSchema, ZodError } from 'zod'
import { ValidationResult, ValidationError } from './types.js'
import { I18nService } from '../i18n/I18nService.js'

export class AppValidator {
    private i18n: I18nService

    constructor(i18n: I18nService) {
        this.i18n = i18n
        this.setupErrorMap()
    }

    validate<T>(data: unknown, schema: ZodSchema<T>): ValidationResult<T> {
        const result = schema.safeParse(data)

        if (result.success) {
            return { valid: true, data: result.data }
        }

        // ZodError issues is the source of truth for safeParse
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

    private setupErrorMap() {
        // @ts-ignore: Bypass Zod type mismatch for callback signature
        z.setErrorMap((issue: any, ctx: any) => {
            const i = issue as any
            let message = ctx?.defaultError || i.message || 'Invalid input'
            const pathStr = i.path?.join('.') || ''

            // Map Zod issues to I18n keys

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

            // Handle email validation checks
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
