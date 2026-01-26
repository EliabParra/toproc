import { IConfig } from '../types/core.js'

export type ValidatorStatus = { result?: boolean; alerts?: string[]; [k: string]: unknown }

export type ParamObject = {
    value?: unknown
    label?: string
    min?: number
    max?: number
    [k: string]: unknown
}

export type ValidatorMessages = Record<string, string>
export type ValidationParam = unknown | ParamObject

function isParamObject(value: unknown): value is ParamObject {
    return value !== null && typeof value === 'object' && !Array.isArray(value)
}

/**
 * Validator utility for validating request parameters and inputs.
 * Supports various types (int, string, email, etc.) and generates localized alerts/messages.
 */
/**
 * Utilidad de validación heredada (Legacy).
 * Usada antes de la migración a Zod/AppValidator.
 *
 * @deprecated Transicionando a `AppValidator` y esquemas Zod.
 */
export default class Validator {
    public status: ValidatorStatus = {}
    public alerts: string[] = []

    /**
     * Localized messages for validation errors.
     * Derived from config.messages.json[lang].alerts
     */
    public msgs: ValidatorMessages

    constructor(config: IConfig, msgs: ValidatorMessages) {
        this.status = {}
        this.alerts = []

        const lang = String(config.app.lang ?? 'en')
        const allMsgs = msgs ?? {}
        const langMsgs = allMsgs[lang]

        // Extract 'alerts' object from language specific messages
        // Expect structure: { en: { alerts: { ... } } }
        const alerts =
            langMsgs && typeof langMsgs === 'object' && 'alerts' in langMsgs
                ? (langMsgs as { alerts?: unknown }).alerts
                : undefined

        this.msgs = (alerts && typeof alerts === 'object' ? alerts : {}) as ValidatorMessages
    }

    /**
     * Get current status object (result of validateAll)
     */
    getStatus(): ValidatorStatus {
        return this.status
    }

    /**
     * Get accumulated alerts
     */
    getAlerts(): string[] {
        return this.alerts
    }

    private extractValue(param: ValidationParam): unknown {
        if (isParamObject(param)) return param.value
        return param
    }

    private formatValue(type: string, param: ValidationParam): unknown {
        if (isParamObject(param)) {
            if (typeof param.label === 'string') return param.label
            if (type === 'length') return param.value
            try {
                return JSON.stringify(param)
            } catch {
                return String(param)
            }
        }
        if (Array.isArray(param)) {
            try {
                return JSON.stringify(param)
            } catch {
                return String(param)
            }
        }
        return param
    }

    /**
     * Formatting helper for error messages. Replaces {value}, {min}, {max}.
     */
    getMessage(type: string, param: ValidationParam): string {
        const value = this.formatValue(type, param)
        const msgTemplate = this.msgs[type] ?? ''

        switch (type) {
            case 'length': {
                const min = isParamObject(param) ? param.min : undefined
                const max = isParamObject(param) ? param.max : undefined

                if (min != null && max != null) {
                    return (this.msgs.lengthRange ?? '')
                        .replace('{value}', String(value))
                        .replace('{min}', String(min))
                        .replace('{max}', String(max))
                }
                if (min != null) {
                    return (this.msgs.lengthMin ?? '')
                        .replace('{value}', String(value))
                        .replace('{min}', String(min))
                }
                if (max != null) {
                    return (this.msgs.lengthMax ?? '')
                        .replace('{value}', String(value))
                        .replace('{max}', String(max))
                }
                // Fallback to range [0, MaxSafeInteger] conceptually
                return (this.msgs.lengthRange ?? '')
                    .replace('{value}', String(value))
                    .replace('{min}', '0')
                    .replace('{max}', String(Number.MAX_SAFE_INTEGER))
            }
            default: {
                let msg = msgTemplate.replace('{value}', String(value))
                if (isParamObject(param)) {
                    if (param.min != null) msg = msg.replace('{min}', String(param.min))
                    if (param.max != null) msg = msg.replace('{max}', String(param.max))
                }
                return msg
            }
        }
    }

    validateInt(param: ValidationParam): boolean {
        const value = this.extractValue(param)
        if (typeof value === 'number' && Number.isInteger(value) && value > 0) return true
        this.alerts = [this.getMessage('int', param)]
        return false
    }

    validateReal(param: ValidationParam): boolean {
        const value = this.extractValue(param)
        if (typeof value === 'number' && Number.isFinite(value)) return true
        this.alerts = [this.getMessage('real', param)]
        return false
    }

    validateString(param: ValidationParam): boolean {
        const value = this.extractValue(param)
        if (typeof value === 'string') return true
        this.alerts = [this.getMessage('string', param)]
        return false
    }

    validateLength(param: ValidationParam, min?: ValidationParam, max?: ValidationParam): boolean {
        if (!this.validateString(param)) return false

        const minValue = min == null ? 0 : this.extractValue(min)
        const minNum = typeof minValue === 'number' ? minValue : NaN
        if (!Number.isInteger(minNum) || minNum < 0) {
            this.alerts = [this.getMessage('int', min ?? minValue)]
            return false
        }

        const maxValue = max == null ? Number.MAX_SAFE_INTEGER : this.extractValue(max)
        const maxNum = typeof maxValue === 'number' ? maxValue : NaN
        if (!Number.isInteger(maxNum) || maxNum < 0) {
            this.alerts = [this.getMessage('int', max ?? maxValue)]
            return false
        }

        const value = this.extractValue(param)
        if (typeof value === 'string' && value.length >= minNum && value.length <= maxNum)
            return true

        this.alerts = [
            this.getMessage('lengthRange', param)
                .replace('{min}', String(minNum))
                .replace('{max}', String(maxNum)),
        ]
        return false
    }

    validateEmail(param: ValidationParam): boolean {
        const value = this.extractValue(param)
        // Simple regex, but effective for basic checking
        const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/
        if (typeof value === 'string' && emailRegex.test(value)) return true

        this.alerts = [this.getMessage('email', param)]
        return false
    }

    validateNotEmpty(param: ValidationParam): boolean {
        const value = this.extractValue(param)
        if (value !== '') return true
        this.alerts = [this.getMessage('notEmpty', param)]
        return false
    }

    validateBoolean(param: ValidationParam): boolean {
        const value = this.extractValue(param)
        if (typeof value === 'boolean') return true
        this.alerts = [this.getMessage('boolean', param)]
        return false
    }

    validateDate(param: ValidationParam): boolean {
        const value = this.extractValue(param)
        if (value instanceof Date && !Number.isNaN(value.getTime())) return true
        if (
            (typeof value === 'string' || typeof value === 'number') &&
            !Number.isNaN(new Date(value).getTime())
        )
            return true
        this.alerts = [this.getMessage('date', param)]
        return false
    }

    validateArray(param: ValidationParam): boolean {
        const value = this.extractValue(param)
        if (Array.isArray(value)) return true
        this.alerts = [this.getMessage('array', param)]
        return false
    }

    validateArrayNotEmpty(param: ValidationParam): boolean {
        const value = this.extractValue(param)
        if (Array.isArray(value) && value.length > 0) return true
        this.alerts = [this.getMessage('arrayNotEmpty', param)]
        return false
    }

    validateObject(param: ValidationParam): boolean {
        const value = this.extractValue(param)
        if (value != null && typeof value === 'object') return true
        this.alerts = [this.getMessage('object', param)]
        return false
    }

    validateObjectNotEmpty(param: ValidationParam): boolean {
        const value = this.extractValue(param)
        if (
            value != null &&
            typeof value === 'object' &&
            !Array.isArray(value) &&
            Object.keys(value as Record<string, unknown>).length > 0
        )
            return true
        this.alerts = [this.getMessage('objectNotEmpty', param)]
        return false
    }

    /**
     * Dispatcher method to validate based on type string.
     */
    validate(value: ValidationParam, type: string): boolean {
        switch (type) {
            case 'int':
                return this.validateInt(value)
            case 'real':
                return this.validateReal(value)
            case 'string':
                return this.validateString(value)
            case 'length':
                return this.validateLength(
                    value,
                    isParamObject(value) ? value.min : undefined,
                    isParamObject(value) ? value.max : undefined
                )
            case 'email':
                return this.validateEmail(value)
            case 'notEmpty':
                return this.validateNotEmpty(value)
            case 'boolean':
                return this.validateBoolean(value)
            case 'date':
                return this.validateDate(value)
            case 'array':
                return this.validateArray(value)
            case 'arrayNotEmpty':
                return this.validateArrayNotEmpty(value)
            case 'object':
                return this.validateObject(value)
            case 'objectNotEmpty':
                return this.validateObjectNotEmpty(value)
            default:
                return false
        }
    }

    /**
     * Batch validation for multiple parameters against types.
     * @param params Array of values to validate
     * @param types Array of type strings
     */
    validateAll(params: unknown, types: unknown): boolean {
        let flag = true
        const paramsArr = Array.isArray(params) ? params : []
        const typesArr = Array.isArray(types) ? types : []
        const sts = new Array(paramsArr.length)

        if (!this.validateArrayNotEmpty(typesArr) || !this.validateArrayNotEmpty(paramsArr)) {
            this.status = { result: false, alerts: ['Parámetros o tipos inválidos'] }
            return false
        }

        const normalizedTypes = (typesArr as any[]).map((t) => String(t).toLowerCase())

        for (let i = 0; i < paramsArr.length; i++) {
            if (!this.validateString(normalizedTypes[i])) {
                this.status = { result: false, alerts: ['Tipos inválidos'] }
                return false
            }
            sts[i] = this.validate(paramsArr[i], normalizedTypes[i])
            flag = flag && sts[i]
        }

        this.alerts = sts
            .map((s, i) => {
                if (!s) return this.getMessage(normalizedTypes[i], paramsArr[i])
                return undefined
            })
            .filter((a): a is string => a !== undefined)

        this.status = {
            result: flag,
            alerts: this.alerts,
        }

        return flag
    }
}
