/**
 * Clases de Error para Auth
 */

import { AuthMessages } from './Auth.Messages.js'

export class AuthError extends Error {
    readonly tag: string
    readonly code: number
    readonly details?: Record<string, unknown>

    constructor(
        message: string,
        tag: string,
        code: number = 500,
        details?: Record<string, unknown>
    ) {
        super(message)
        this.name = 'AuthError'
        this.tag = tag
        this.code = code
        this.details = details

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, AuthError)
        }
    }

    toJSON() {
        return {
            name: this.name,
            message: this.message,
            tag: this.tag,
            code: this.code,
            details: this.details,
        }
    }
}

export class AuthNotFoundError extends AuthError {
    constructor() {
        super(AuthMessages.USER_NOT_FOUND, 'AUTH_USER_NOT_FOUND', 404)
        this.name = 'AuthNotFoundError'
    }
}

export class AuthInvalidCredentialsError extends AuthError {
    constructor() {
        super(AuthMessages.INVALID_CREDENTIALS, 'AUTH_INVALID_CREDENTIALS', 401)
        this.name = 'AuthInvalidCredentialsError'
    }
}

export class AuthEmailNotVerifiedError extends AuthError {
    constructor() {
        super(AuthMessages.EMAIL_NOT_VERIFIED, 'AUTH_EMAIL_NOT_VERIFIED', 403)
        this.name = 'AuthEmailNotVerifiedError'
    }
}

export class AuthSessionExpiredError extends AuthError {
    constructor() {
        super(AuthMessages.SESSION_EXPIRED, 'AUTH_SESSION_EXPIRED', 401)
        this.name = 'AuthSessionExpiredError'
    }
}

export class AuthTokenInvalidError extends AuthError {
    constructor() {
        super(AuthMessages.TOKEN_INVALID, 'AUTH_TOKEN_INVALID', 400)
        this.name = 'AuthTokenInvalidError'
    }
}

export class AuthEmailExistsError extends AuthError {
    constructor(email?: string) {
        super(AuthMessages.EMAIL_ALREADY_EXISTS, 'AUTH_EMAIL_EXISTS', 409, { email })
        this.name = 'AuthEmailExistsError'
    }
}

export class AuthAccountDisabledError extends AuthError {
    constructor() {
        super(AuthMessages.ACCOUNT_DISABLED, 'AUTH_ACCOUNT_DISABLED', 403)
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
