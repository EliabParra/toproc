import rateLimit from 'express-rate-limit'

/** @param {{ object_na?: string, method_na?: string } | null | undefined} txData */
function isAuthPublicSensitiveMethod(txData: any) {
    const object_na = txData?.object_na
    const method_na = txData?.method_na
    if (object_na !== 'Auth') return false
    return (
        method_na === 'register' ||
        method_na === 'requestEmailVerification' ||
        method_na === 'verifyEmail' ||
        method_na === 'requestPasswordReset' ||
        method_na === 'verifyPasswordReset' ||
        method_na === 'resetPassword'
    )
}

function safeLowerTrim(v: any) {
    return typeof v === 'string' ? v.trim().toLowerCase() : null
}

function getTxDataFromReq(req: any, security: any) {
    const tx = req?.body?.tx
    if (tx == null) return null
    try {
        return (security as any)?.getDataTx?.(tx) ?? null
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
export function createLoginRateLimiter(clientErrors: any) {
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
export function createAuthPasswordResetRateLimiter(clientErrors: any, security: any) {
    return rateLimit({
        windowMs: 60 * 1000,
        limit: (req: any) => {
            const txData = getTxDataFromReq(req, security)
            const method = txData?.method_na
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
        skip: (req: any) => {
            const txData = getTxDataFromReq(req, security)
            return !isAuthPublicSensitiveMethod(txData)
        },
        keyGenerator: (req: any) => {
            const txData = getTxDataFromReq(req, security)
            const method = txData?.method_na
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
export function createToProccessRateLimiter(clientErrors: any) {
    return rateLimit({
        windowMs: 60 * 1000,
        limit: 120,
        standardHeaders: true,
        legacyHeaders: false,
        keyGenerator: (req: any) => {
            const userId = (req as any)?.session?.user_id
            return userId ? `user:${userId}` : `ip:${(req as any).ip}`
        },
        handler: (req: AppRequest, res: AppResponse) =>
            res.status(clientErrors.tooManyRequests.code).send(clientErrors.tooManyRequests),
    })
}
