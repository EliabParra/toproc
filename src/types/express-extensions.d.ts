import 'express-session'
import { Session, SessionData } from 'express-session'

declare module 'express-session' {
    interface SessionData {
        user_id?: number
        user_na?: string
        profile_id?: number
        [key: string]: any
    }
}

// Augment the core Express definition which others extend
declare module 'express-serve-static-core' {
    interface Request {
        requestId?: string
        requestStartMs?: number
        session?: Session & SessionData
    }
}
