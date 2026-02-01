import { ZodType, ZodError, ZodIssue } from 'zod'
import { IValidator, II18nService } from '../types/core.js'
import type { ValidationResult, ValidationError } from '../types/api.js'

// Interface compatible with ZodIssue to avoid strict type mismatch issues
interface ZodIssueCompatible {
    code: string
    path: (string | number)[]
    message: string
}

export class AppValidator implements IValidator {
    constructor(private i18n: II18nService) {
        // Zod global error map removed to avoid side effects and deprecation warnings
    }

    /**
     * Valida datos usando Zod y retorna un resultado estructurado.
     * Soporta traducciones personalizadas sin efectos secundarios globales.
     */
    validate<T>(data: unknown, schema: ZodType): ValidationResult<T> {
        // Use default safeParse without custom errorMap to support older Zod versions if needed,
        // or passing errorMap in options if version allows (zod 3.23.8+ handles it well)
        // But since we want full compatibility and control, we post-process messages.
        const result = schema.safeParse(data)

        if (result.success) {
            return { valid: true, data: result.data as T }
        }

        // Map errors manually to ensure localization
        const errors: ValidationError[] = result.error.issues.map((zodIssue) => {
            const issue = zodIssue as ZodIssueCompatible
            const pathStr = issue.path.join('.') || 'root' // Ensure path is string

            let message = issue.message

            // custom logic to extract localized message based on issue code
            const localized = this.resolveLocalizedError(issue)
            if (localized) {
                message = localized
            } else {
                // Fallback to simpler translation if possible
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

    /**
     * Resolves a localized error message from a Zod issue.
     */
    private resolveLocalizedError(issue: ZodIssueCompatible): string | null {
        try {
            // Type-safe access to validation alert messages
            interface AlertMessages {
                string?: string
                number?: string
                lengthMin?: string
                lengthMax?: string
                email?: string
                notEmpty?: string
            }
            const msgs = (this.i18n.messages as { alerts?: AlertMessages }).alerts
            if (!msgs) return null

            if (issue.code === 'invalid_type') {
                const realIssue = issue as { expected?: string }
                if (realIssue.expected === 'string') return msgs.string || 'Must be a string'
                if (realIssue.expected === 'number') return msgs.number || 'Must be a number'
                return this.i18n.t('errors.client.invalidParameters.msg')
            }
            if (issue.code === 'too_small') {
                return msgs.lengthMin || 'Too short'
            }
            if (issue.code === 'too_big') {
                return msgs.lengthMax || 'Too long'
            }
            if (issue.code === 'invalid_string') {
                const realIssue = issue as { validation?: string }
                if (realIssue.validation === 'email') return msgs.email || 'Invalid email'
            }

            return null
        } catch (e) {
            return null
        }
    }

    /**
     * Extracts simple string alerts from validation errors.
     */
    getAlerts(errors: ValidationError[]): string[] {
        return errors.map((e) => e.message)
    }

    /**
     * Legacy method for compatibility if needed
     */
    format(msg: string, ...args: any[]): string {
        return this.i18n.format(msg, ...args)
    }
}
