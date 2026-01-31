import { BOError } from '../../src/core/errors/BOError.js'

export class AuthError extends BOError {
    constructor(
        message: string,
        tag: string,
        code: number = 500,
        details?: Record<string, unknown>
    ) {
        super(message, tag, code, details)
        this.name = 'AuthError'
    }
}

export class AuthNotFoundError extends AuthError {
    constructor() {
        super('bo.auth.userNotFound', 'AUTH_USER_NOT_FOUND', 404)
        this.name = 'AuthNotFoundError'
    }
}

export class AuthInvalidCredentialsError extends AuthError {
    constructor() {
        super('bo.auth.invalidCredentials', 'AUTH_INVALID_CREDENTIALS', 401)
        this.name = 'AuthInvalidCredentialsError'
    }
}

export class AuthEmailNotVerifiedError extends AuthError {
    constructor() {
        super('bo.auth.emailNotVerified', 'AUTH_EMAIL_NOT_VERIFIED', 403)
        this.name = 'AuthEmailNotVerifiedError'
    }
}

export class AuthSessionExpiredError extends AuthError {
    constructor() {
        super('bo.auth.sessionExpired', 'AUTH_SESSION_EXPIRED', 401)
        this.name = 'AuthSessionExpiredError'
    }
}

export class AuthTokenInvalidError extends AuthError {
    constructor() {
        super('bo.auth.tokenInvalid', 'AUTH_TOKEN_INVALID', 400)
        this.name = 'AuthTokenInvalidError'
    }
}

export class AuthEmailExistsError extends AuthError {
    constructor(email?: string) {
        super('bo.auth.emailAlreadyExists', 'AUTH_EMAIL_EXISTS', 409, { email })
        this.name = 'AuthEmailExistsError'
    }
}

export class AuthAccountDisabledError extends AuthError {
    constructor() {
        super('bo.auth.accountDisabled', 'AUTH_ACCOUNT_DISABLED', 403)
        this.name = 'AuthAccountDisabledError'
    }
}

export function handleAuthError(error: unknown): AuthError {
    if (error instanceof AuthError) {
        return error
    }
    if (error instanceof Error) {
        return new AuthError(error.message, 'AUTH_UNKNOWN_ERROR', 500)
    }
    return new AuthError('Error desconocido en Auth', 'AUTH_UNKNOWN_ERROR', 500)
}

export function isAuthError(error: unknown): error is AuthError {
    return error instanceof AuthError
}