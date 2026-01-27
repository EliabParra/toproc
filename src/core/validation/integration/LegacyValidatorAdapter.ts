import { AppValidator } from '../AppValidator.js'
import { ZodObject, ZodType, z } from 'zod'
import { ValidatorStatus } from '../../../utils/Validator.js'

/**
 * Adapter to allow legacy code using g.v attributes/methods to usage AppValidator (Zod).
 * Implements the same public interface as src/utils/Validator.ts but delegates to Zod schemas.
 */
export class LegacyValidatorAdapter {
    public status: ValidatorStatus = {}
    public alerts: string[] = []

    // Maintain msgs property for legacy code accessing plain messages (though rare)
    public msgs: any = {}

    constructor(private validator: AppValidator) {}

    getStatus() {
        return this.status
    }

    getAlerts() {
        return this.alerts
    }

    getMessage(kind: string, options: any = {}): string {
        const { label, min } = options
        if (kind === 'length') return `${label} length must be >= ${min}`
        return `${label} must be ${kind}`
    }

    /**
     * Main legacy method: v.validate(value, type)
     */
    validate(value: unknown, type: string): boolean {
        let schema: ZodType

        switch (type) {
            case 'int':
                schema = z.number().int().positive()
                break
            case 'string':
                schema = z.string()
                break
            case 'email':
                schema = z.string().email()
                break
            case 'notEmpty':
                schema = z.string().min(1)
                break
            case 'boolean':
                schema = z.boolean()
                break
            case 'array':
                schema = z.array(z.any())
                break
            case 'arrayNotEmpty':
                schema = z.array(z.any()).min(1)
                break
            case 'object':
                schema = z.object({}).passthrough()
                break
            case 'objectNotEmpty':
                schema = z
                    .object({})
                    .passthrough()
                    .refine((obj) => Object.keys(obj).length > 0)
                break
            default:
                this.alerts = ['Tipo de validación desconocido']
                return false
        }

        try {
            const result = this.validator.validate(value, schema as ZodObject)

            if (!result.valid) {
                const errors = result.errors || [{ message: 'Unknown validation error' }]
                this.alerts = errors.map((e) => e.message || 'Error')
                return false
            }

            return true
        } catch (err: any) {
            console.error('[LegacyValidatorAdapter] Unexpected error:', err)
            this.alerts = ['Internal validation error']
            return false
        }
    }

    /**
     * Batch validation: validateAll(params[], types[])
     */
    validateAll(params: unknown, types: unknown): boolean {
        if (!Array.isArray(params) || !Array.isArray(types)) {
            this.status = { result: false, alerts: ['Parámetros o tipos inválidos'] }
            return false
        }

        let allValid = true
        let alerts: string[] = []

        for (let i = 0; i < params.length; i++) {
            const val = params[i]
            const type = String(types[i])
            const valid = this.validate(val, type)
            if (!valid) {
                allValid = false
                alerts = [...alerts, ...this.alerts]
            }
        }

        this.status = {
            result: allValid,
            alerts: allValid ? [] : alerts,
        }
        this.alerts = this.status.alerts!
        return allValid
    }

    // Methods specific to legacy implementation that might be called:
    validateInt(param: unknown): boolean {
        return this.validate(param, 'int')
    }
    validateString(param: unknown): boolean {
        return this.validate(param, 'string')
    }
    validateEmail(param: unknown): boolean {
        return this.validate(param, 'email')
    }
}
