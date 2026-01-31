export {}

declare global {
    type AppConfig = {
        app: {
            lang: string
            host: string
            port: number
            name: string
            trustProxy?: boolean | number | string
            frontendMode: string
            [k: string]: unknown
        }
        bo: {
            path: string
            [k: string]: unknown
        }
        auth?: {
            [k: string]: unknown
        }
        session?: {
            cookie?: {
                sameSite?: any
                secure?: any
                maxAge?: number
                [k: string]: unknown
            }
            [k: string]: unknown
        }
        [k: string]: unknown
    }

    type AppLog = {
        TYPE_ERROR: any
        TYPE_INFO: any
        show: (event: any) => any
    }

    type AppDb = {
        exe: (schema: string, query: string, params: any) => Promise<any>
        pool?: {
            end?: () => Promise<any> | any
        }
    }

    type AppSecurity = {
        isReady: boolean
        ready: Promise<any>
        initError?: unknown
        getPermissions: (data: any) => boolean
        getDataTx: (tx: any) => any
        executeMethod: (data: any) => Promise<any>
        [k: string]: unknown
    }

    // Global 'require' is still useful in some contexts (legacy)
    const require: any

    interface GlobalThis {
        // Only keep truly global things if strictly necessary, otherwise clean state
        require: any
        __alerts?: any[] // Used in tests
    }
}
