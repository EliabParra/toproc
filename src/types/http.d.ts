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

    interface AppRequest extends ExpressRequest {
        session?: import('express-session').Session & import('express-session').SessionData
    }
    interface AppResponse extends ExpressResponse {}

    // Standard API Response
    export interface ApiResponse<T = unknown> {
        code: number
        msg: string
        data?: T | null
        alerts?: string[]
    }

    // Success Response (code 200-299)
    export interface SuccessResponse<T = unknown> extends ApiResponse<T> {
        code: 200 | 201
        data: T
    }

    // Error Response (code 400+)
    export interface ErrorResponse extends ApiResponse<null> {
        code: 400 | 401 | 403 | 404 | 500
        data: null
        alerts: string[]
    }

    // Common Auth Types
    export interface LoginRequest {
        loginId: string
        password: string
    }

    export interface SessionUser {
        userId: number
        username: string
        profileId: number
    }
}
