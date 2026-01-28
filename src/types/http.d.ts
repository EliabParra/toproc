import { Request as ExpressRequest, Response as ExpressResponse } from 'express'
import 'express-session'

declare module 'express-session' {
    interface SessionData {
        user_id?: number
        user_na?: string
        profile_id?: number
        [key: string]: any
    }
}

declare global {
    namespace Express {
        interface Request {
            requestId?: string
            requestStartMs?: number
        }
    }

    // Restore global aliases as interfaces to ensure visibility
    interface AppRequest extends ExpressRequest {
        session?: import('express-session').Session & import('express-session').SessionData
    }
    interface AppResponse extends ExpressResponse {}

    interface ApiError {
        code: number
        msg: string
        [key: string]: any
    }
}
