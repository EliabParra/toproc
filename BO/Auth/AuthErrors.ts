import { BOError, TxKey } from '../../src/core/business-objects/index.js'
import { AuthMessages } from './AuthModule.js'

const defaultMessages = AuthMessages.es

export class AuthError extends BOError {
    constructor(
        message: TxKey | (string & {}),
        tag: string,
        code: number = 500,
        details?: Record<string, unknown>
    ) {
        super(message, tag, code, details)
        this.name = 'AuthError'
    }
}

export class AuthNotFoundError extends AuthError {
    constructor(message?: string) {
        super(message ?? defaultMessages.userNotFound, 'AUTH_USER_NOT_FOUND', 404)
        this.name = 'AuthNotFoundError'
    }
}

export class AuthInvalidCredentialsError extends AuthError {
    constructor(message?: string) {
        super(message ?? defaultMessages.invalidCredentials, 'AUTH_INVALID_CREDENTIALS', 401)
        this.name = 'AuthInvalidCredentialsError'
    }
}

export class AuthEmailNotVerifiedError extends AuthError {
    constructor(message?: string) {
        super(message ?? defaultMessages.emailNotVerified, 'AUTH_EMAIL_NOT_VERIFIED', 403)
        this.name = 'AuthEmailNotVerifiedError'
    }
}

export class AuthSessionExpiredError extends AuthError {
    constructor(message?: string) {
        super(message ?? defaultMessages.sessionExpired, 'AUTH_SESSION_EXPIRED', 401)
        this.name = 'AuthSessionExpiredError'
    }
}

export class AuthTokenInvalidError extends AuthError {
    constructor(message?: string) {
        super(message ?? defaultMessages.tokenInvalid, 'AUTH_TOKEN_INVALID', 400)
        this.name = 'AuthTokenInvalidError'
    }
}

export class AuthEmailExistsError extends AuthError {
    constructor(message?: string, email?: string) {
        super(message ?? defaultMessages.emailAlreadyExists, 'AUTH_EMAIL_EXISTS', 409, { email })
        this.name = 'AuthEmailExistsError'
    }
}

export class AuthAccountDisabledError extends AuthError {
    constructor(message?: string) {
        super(message ?? defaultMessages.accountDisabled, 'AUTH_ACCOUNT_DISABLED', 403)
        this.name = 'AuthAccountDisabledError'
    }
}

export function handleAuthError(error: unknown): AuthError {
    if (error instanceof AuthError) {
        return error
    }
    if (error instanceof Error) {
        return new AuthError('errors.server.serverError', 'AUTH_UNKNOWN_ERROR', 500, {
            message: error.message,
        })
    }
    return new AuthError('errors.server.serverError', 'AUTH_UNKNOWN_ERROR', 500)
}

export function isAuthError(error: unknown): error is AuthError {
    return error instanceof AuthError
}
