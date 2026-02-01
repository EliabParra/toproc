import express, { Express, RequestHandler, NextFunction, Request, Response } from 'express'
import { Server } from 'http'
import {
    IConfig,
    ILogger,
    ISecurityService,
    ISessionService,
    IAuditService,
    IDatabase,
    II18nService,
    AppRequest,
    AppResponse,
    LocalizedMessages,
} from '../types/index.js'
import { registerFrontendHosting } from '../frontend-adapters/index.js'

// Middlewares consolidados
import {
    applyHelmet,
    applyRequestId,
    applyRequestLogger,
    applyCorsIfEnabled,
    applyBodyParsers,
    createJsonSyntaxErrorHandler,
    createCsrfProtection,
    createCsrfTokenHandler,
    createFinalErrorHandler,
} from './http/middleware/index.js'

// Rate limiters
import {
    createLoginRateLimiter,
    createToProccessRateLimiter,
    createAuthPasswordResetRateLimiter,
    ClientErrors,
} from './http/rate-limit/index.js'

// Handlers
import { createHealthHandler, createReadyHandler } from './http/handlers/index.js'
import { AuthController } from './http/controllers/AuthController.js'
import { TransactionController } from './http/controllers/TransactionController.js'

/**
 * Dependencias requeridas para instanciar el AppServer.
 */
interface AppServerDependencies {
    config: IConfig
    log: ILogger
    security: ISecurityService
    session: ISessionService
    i18n: II18nService
    audit: IAuditService
    db: IDatabase
}

/**
 * Servidor de Aplicación (AppServer).
 *
 * Responsable de:
 * - Bootstrapping de Express.
 * - Configuración de Middlewares globales.
 * - Enrutamiento a controladores.
 * - Ciclo de vida del servidor HTTP.
 *
 * Antes conocido como Dispatcher.
 */
export class AppServer {
    /** Instancia de Express */
    public app: Express

    /** Servidor HTTP (null hasta llamar serverOn) */
    public server: Server | null

    /** Indica si init() fue ejecutado */
    public initialized: boolean

    // Dependencias inyectadas
    private readonly config: IConfig
    private readonly log: ILogger
    private readonly security: ISecurityService
    private readonly session: ISessionService
    private readonly i18n: II18nService
    private readonly audit: IAuditService
    private readonly db: IDatabase

    // Controladores
    private authController!: AuthController
    private txController!: TransactionController

    // Cache de mensajes localizados (para rate limiters y error handler)
    private serverErrors: LocalizedMessages
    private clientErrors: LocalizedMessages

    // Middlewares guardados
    private loginRateLimiter: RequestHandler
    private authPasswordResetRateLimiter: RequestHandler
    private csrfTokenHandler: RequestHandler
    private csrfProtection: RequestHandler
    private _toProccessRateLimiter: RequestHandler | null = null

    constructor(deps: AppServerDependencies) {
        this.config = deps.config
        this.log = deps.log
        this.security = deps.security
        this.session = deps.session
        this.i18n = deps.i18n
        this.audit = deps.audit
        this.db = deps.db

        this.app = express()
        this.server = null
        this.initialized = false

        this.serverErrors = this.i18n.get('errors.server') as LocalizedMessages
        this.clientErrors = this.i18n.get('errors.client') as LocalizedMessages

        // Configurar Express base
        this.setupExpress()

        // Inicializar Middlewares de Seguridad (Factories)
        this.csrfTokenHandler = createCsrfTokenHandler({
            config: this.config,
            i18n: this.i18n,
        } as any)
        this.csrfProtection = createCsrfProtection({ config: this.config, i18n: this.i18n } as any)

        this.loginRateLimiter = createLoginRateLimiter(this.clientErrors as unknown as ClientErrors)
        this.authPasswordResetRateLimiter = createAuthPasswordResetRateLimiter(
            this.clientErrors as unknown as ClientErrors,
            this.security
        )
    }

    /**
     * Rate limiter para /toProccess (lazy initialization).
     */
    public get toProccessRateLimiter(): RequestHandler {
        if (!this._toProccessRateLimiter) {
            this._toProccessRateLimiter = createToProccessRateLimiter(
                this.clientErrors as unknown as ClientErrors
            )
        }
        return this._toProccessRateLimiter
    }

    private setupExpress(): void {
        this.app.disable('x-powered-by')
        if (this.config.app.trustProxy != null) {
            this.app.set('trust proxy', this.config.app.trustProxy)
        }
        applyHelmet(this.app)
        applyRequestId(this.app)
        applyRequestLogger(this.app, { log: this.log } as any)
        applyCorsIfEnabled(this.app, { config: this.config } as any)
        applyBodyParsers(this.app, this.config)
        this.app.use(createJsonSyntaxErrorHandler({ config: this.config, i18n: this.i18n }))
    }

    /**
     * Inicializa el servidor, controladores y rutas.
     */
    async init(): Promise<void> {
        // 1. Instanciar Controladores
        this.authController = new AuthController({
            session: this.session,
            audit: this.audit,
            log: this.log,
            i18n: this.i18n,
        })

        this.txController = new TransactionController({
            security: this.security,
            session: this.session,
            audit: this.audit,
            config: this.config,
            i18n: this.i18n,
            log: this.log,
        })

        // 2. Session Middleware
        const { applySessionMiddleware } =
            await import('./http/session/apply-session-middleware.js')
        applySessionMiddleware(this.app, {
            config: this.config,
            log: this.log,
            db: this.db,
        })

        // 3. Frontend Pre-API (SPA support)
        await registerFrontendHosting(this.app, {
            session: { sessionExists: (req: AppRequest) => this.session.sessionExists(req) },
            stage: 'preApi',
            config: this.config,
            i18n: this.i18n,
            log: this.log,
        })

        // 4. Rutas API
        this.setupRoutes()

        // 5. Frontend Post-API (Fallbacks)
        await registerFrontendHosting(this.app, {
            session: { sessionExists: (req: AppRequest) => this.session.sessionExists(req) },
            stage: 'postApi',
            config: this.config,
            i18n: this.i18n,
            log: this.log,
        })

        // 6. Error Handler Final
        this.app.use(
            createFinalErrorHandler({
                clientErrors: this.clientErrors,
                serverErrors: this.serverErrors,
                log: this.log,
            })
        )

        this.initialized = true
    }

    private setupRoutes(): void {
        const router = express.Router()

        // Probes
        router.get('/health', createHealthHandler({ name: this.config.app.name }))
        router.get('/ready', createReadyHandler(this.security))

        // Security
        router.get('/csrf', this.csrfTokenHandler)

        // Auth
        router.post('/login', this.loginRateLimiter, this.csrfProtection, (req, res, next) =>
            this.authController.login(req as AppRequest, res as AppResponse, next)
        )
        router.post('/logout', this.csrfProtection, (req, res, next) =>
            this.authController.logout(req as AppRequest, res as AppResponse, next)
        )

        // Transactions
        router.post(
            '/toProccess',
            this.toProccessRateLimiter,
            this.authPasswordResetRateLimiter,
            this.csrfProtection,
            (req, res, next) =>
                this.txController.handle(req as AppRequest, res as AppResponse, next)
        )

        this.app.use(router)
    }

    serverOn(): Server {
        if (!this.initialized) throw new Error('AppServer not initialized')
        this.server = this.app.listen(this.config.app.port, () =>
            this.log.show({
                type: this.log.TYPE_INFO,
                msg: `Servidor ejecutándose en http://${this.config.app.host}:${this.config.app.port}`,
            })
        )
        return this.server
    }

    async shutdown(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.server) return resolve()
            this.server.close((err) => (err ? reject(err) : resolve()))
        })
    }
}
