export type ValidationSuccess<T> = {
    valid: true
    data: T
}

export type ValidationFailure = {
    valid: false
    errors: ValidationError[]
    alerts?: string[]
}

export type ValidationError = {
    path: string
    message: string
    code?: string
}

export type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure
