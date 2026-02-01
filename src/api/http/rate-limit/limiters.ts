import rateLimit from 'express-rate-limit'
import type { AppRequest, AppResponse, ISecurityService } from '../../../types/index.js'

/** Tipos para rate limiters */
interface TxData {
    objectName?: string
    methodName?: string
}

export interface ClientErrors {
    tooManyRequests: { code: number; msg: string }
}

/** @param {{ objectName?: string, methodName?: string } | null | undefined} txData */
function isAuthPublicSensitiveMethod(txData: TxData | null | undefined): boolean {
    const objectName = txData?.objectName
    const methodName = txData?.methodName
    if (objectName !== 'Auth') return false
    return (
        methodName === 'register' ||
        methodName === 'requestEmailVerification' ||
        methodName === 'verifyEmail' ||
        methodName === 'requestPasswordReset' ||
        methodName === 'verifyPasswordReset' ||
        methodName === 'resetPassword'
    )
}

function safeLowerTrim(v: unknown): string | null {
    return typeof v === 'string' ? v.trim().toLowerCase() : null
}

function getTxDataFromReq(req: AppRequest, security: ISecurityService): TxData | null {
    const tx = req?.body?.tx
    if (tx == null) return null
    try {
        const result = security?.getDataTx?.(tx)
        return result ? result : null
    } catch {
        return null
    }
}

/**
 * Crea limitador para intentos de inicio de sesión.
 *
 * Protege endpoint de login contra fuerza bruta.
 *
 * @function createLoginRateLimiter
 * @param clientErrors - Diccionario de errores
 * @returns {Function} Middleware rateLimit
 */
export function createLoginRateLimiter(clientErrors: ClientErrors) {
    return rateLimit({
        windowMs: 60 * 1000,
        limit: 10,
        standardHeaders: true,
        legacyHeaders: false,
        handler: (req: AppRequest, res: AppResponse) =>
            res.status(clientErrors.tooManyRequests.code).send(clientErrors.tooManyRequests),
    })
}

/**
 * Limitador especializado para flujos críticos de Auth (Reset Password, Verificación).
 *
 * Aplica límites estrictos por IP y/u objetivo (email/token) para prevenir enumeración y brute-force.
 * Genera claves únicas basándose en payload del body (email, username, token).
 *
 * @function createAuthPasswordResetRateLimiter
 * @param clientErrors - Diccionario de errores
 * @param security - Servicio de seguridad para resolver TX
 * @returns {Function} Middleware rateLimit
 */
export function createAuthPasswordResetRateLimiter(
    clientErrors: ClientErrors,
    security: ISecurityService
) {
    return rateLimit({
        windowMs: 60 * 1000,
        limit: (req: AppRequest) => {
            const txData = getTxDataFromReq(req, security)
            const method = txData?.methodName
            if (method === 'register') return 5
            if (method === 'requestEmailVerification') return 5
            if (method === 'verifyEmail') return 10
            if (method === 'requestPasswordReset') return 5
            if (method === 'verifyPasswordReset') return 10
            if (method === 'resetPassword') return 10
            return 10
        },
        standardHeaders: true,
        legacyHeaders: false,
        skip: (req: AppRequest) => {
            const txData = getTxDataFromReq(req, security)
            return !isAuthPublicSensitiveMethod(txData)
        },
        keyGenerator: (req: AppRequest) => {
            const txData = getTxDataFromReq(req, security)
            const method = txData?.methodName
            const ip = req.ip

            if (method === 'register') {
                const email = safeLowerTrim(req?.body?.params?.email)
                const username = safeLowerTrim(req?.body?.params?.username)
                return email && username
                    ? `auth:register:ip:${ip}:email:${email}:user:${username}`
                    : email
                      ? `auth:register:ip:${ip}:email:${email}`
                      : `auth:register:ip:${ip}`
            }

            if (method === 'requestEmailVerification') {
                const email = safeLowerTrim(req?.body?.params?.email)
                return email
                    ? `auth:emailVerify:request:ip:${ip}:email:${email}`
                    : `auth:emailVerify:request:ip:${ip}`
            }

            if (method === 'verifyEmail') {
                const token = safeLowerTrim(req?.body?.params?.token)
                const tokenKey = token ? token.slice(0, 16) : null
                return tokenKey
                    ? `auth:emailVerify:verify:ip:${ip}:token:${tokenKey}`
                    : `auth:emailVerify:verify:ip:${ip}`
            }

            if (method === 'requestPasswordReset') {
                const identifier = safeLowerTrim(req?.body?.params?.identifier)
                return identifier
                    ? `authReset:request:ip:${ip}:id:${identifier}`
                    : `authReset:request:ip:${ip}`
            }

            if (method === 'verifyPasswordReset' || method === 'resetPassword') {
                const token = safeLowerTrim(req?.body?.params?.token)
                const tokenKey = token ? token.slice(0, 16) : null
                return tokenKey
                    ? `authReset:${method}:ip:${ip}:token:${tokenKey}`
                    : `authReset:${method}:ip:${ip}`
            }

            return `authReset:ip:${ip}`
        },
        handler: (req: AppRequest, res: AppResponse) =>
            res.status(clientErrors.tooManyRequests.code).send(clientErrors.tooManyRequests),
    })
}

/**
 * Limitador general para API logueada.
 *
 * Limita peticiones por usuario (si hay sesión) o por IP.
 * Previene abuso general del sistema.
 *
 * @function createToProccessRateLimiter
 * @param clientErrors - Diccionario de errores
 * @returns {Function} Middleware rateLimit
 */
export function createToProccessRateLimiter(clientErrors: ClientErrors) {
    return rateLimit({
        windowMs: 60 * 1000,
        limit: 120,
        standardHeaders: true,
        legacyHeaders: false,
        keyGenerator: (req: AppRequest) => {
            const userId = req?.session?.userId
            return userId ? `user:${userId}` : `ip:${req.ip}`
        },
        handler: (req: AppRequest, res: AppResponse) =>
            res.status(clientErrors.tooManyRequests.code).send(clientErrors.tooManyRequests),
    })
}
