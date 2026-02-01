import type { AppResponse } from '../types/http.js'

/**
 * Sends a standardized `invalidParameters` response.
 */
export function sendInvalidParameters(
    res: AppResponse,
    invalidParametersError: { code: number; msg: string },
    alerts: string[]
) {
    return res.status(invalidParametersError.code).send({
        msg: invalidParametersError.msg,
        code: invalidParametersError.code,
        alerts,
    })
}
