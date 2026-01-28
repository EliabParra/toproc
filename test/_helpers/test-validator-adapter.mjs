/**
 * TestValidatorAdapter - Mock adapter for tests.
 * Replaces LegacyValidatorAdapter functionality for test purposes only.
 */

export class TestValidatorAdapter {
    constructor(validator) {
        this.validator = validator
        this.status = {}
        this.alerts = []
        this.msgs = {}
    }

    getStatus() {
        return this.status
    }

    getAlerts() {
        return this.alerts
    }

    getMessage(kind, options = {}) {
        const { label, min } = options
        if (kind === 'length') return `${label} length must be >= ${min}`
        return `${label} must be ${kind}`
    }

    validate(value, type) {
        const schemaMap = {
            int: (v) => typeof v === 'number' && Number.isInteger(v) && v > 0,
            string: (v) => typeof v === 'string',
            email: (v) => typeof v === 'string' && v.includes('@'),
            notEmpty: (v) => typeof v === 'string' && v.length > 0,
            boolean: (v) => typeof v === 'boolean',
            array: (v) => Array.isArray(v),
            arrayNotEmpty: (v) => Array.isArray(v) && v.length > 0,
            object: (v) => v !== null && typeof v === 'object' && !Array.isArray(v),
            objectNotEmpty: (v) =>
                v !== null &&
                typeof v === 'object' &&
                !Array.isArray(v) &&
                Object.keys(v).length > 0,
        }

        const check = schemaMap[type]
        if (!check) {
            this.alerts = ['Tipo de validación desconocido']
            return false
        }

        if (!check(value)) {
            this.alerts = [`Validation failed for type ${type}`]
            return false
        }

        this.alerts = []
        return true
    }

    validateAll(params, types) {
        if (!Array.isArray(params) || !Array.isArray(types)) {
            this.status = { result: false, alerts: ['Parámetros o tipos inválidos'] }
            return false
        }

        let allValid = true
        let alerts = []

        for (let i = 0; i < params.length; i++) {
            const valid = this.validate(params[i], String(types[i]))
            if (!valid) {
                allValid = false
                alerts = [...alerts, ...this.alerts]
            }
        }

        this.status = {
            result: allValid,
            alerts: allValid ? [] : alerts,
        }
        this.alerts = this.status.alerts
        return allValid
    }

    validateInt(param) {
        return this.validate(param, 'int')
    }
    validateString(param) {
        return this.validate(param, 'string')
    }
    validateEmail(param) {
        return this.validate(param, 'email')
    }
}
