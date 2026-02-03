import express, { Express, RequestHandler } from 'express'
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
    IValidator,
    IEmailService,
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
} from './http/rate-limit/index.js'

import { PermissionGuard } from '../core/security/PermissionGuard.js'
import { AuthorizationService } from '../core/security/AuthorizationService.js'
import { TransactionMapper } from '../core/transaction/TransactionMapper.js'
import { TransactionExecutor } from '../core/transaction/TransactionExecutor.js'
import { TransactionOrchestrator } from '../core/transaction/TransactionOrchestrator.js'

// Handlers
import { AuthController } from './http/controllers/AuthController.js'
import { TransactionController } from './http/controllers/TransactionController.js'
import { ProbeController } from './http/controllers/ProbeController.js'

/**
 * Dependencias requeridas para instanciar el AppServer.
 */
interface AppServerDependencies {
    config: IConfig
    log: ILogger
    security: ISecurityService // Mantener por ahora para probeController
    session: ISessionService
    i18n: II18nService
    audit: IAuditService
    db: IDatabase
    validator: IValidator // [NEW] Required for BOs
    email: IEmailService
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
    private readonly validator: IValidator
    private readonly email: IEmailService

    // Servicios Core (Nuevos)
    private authorization!: AuthorizationService
    private orchestrator!: TransactionOrchestrator

    // Controladores
    private authController!: AuthController
    private txController!: TransactionController
    private probeController!: ProbeController

    // Middlewares guardados
    private loginRateLimiter: RequestHandler
    private authPasswordResetRateLimiter: RequestHandler
    private csrfTokenHandler: RequestHandler
    private csrfProtection: RequestHandler
    private _toProccessRateLimiter: RequestHandler | null = null

    constructor(deps: AppServerDependencies) {
        this.config = deps.config
        this.log = deps.log.child({ category: 'System' })
        this.security = deps.security
        this.session = deps.session
        this.i18n = deps.i18n
        this.audit = deps.audit
        this.db = deps.db
        this.validator = deps.validator
        this.email = deps.email

        this.app = express()
        this.server = null
        this.initialized = false

        // Configurar Express base
        this.setupExpress()

        // Inicializar Middlewares de Seguridad (Factories)
        this.csrfTokenHandler = createCsrfTokenHandler(this.i18n)
        this.csrfProtection = createCsrfProtection(this.i18n)

        this.loginRateLimiter = createLoginRateLimiter(this.i18n.messages.errors.client)
        this.authPasswordResetRateLimiter = createAuthPasswordResetRateLimiter(
            this.i18n.messages.errors.client,
            this.security
        )
    }

    /**
     * Rate limiter para /toProccess (lazy initialization).
     */
    public get toProccessRateLimiter(): RequestHandler {
        if (!this._toProccessRateLimiter) {
            this._toProccessRateLimiter = createToProccessRateLimiter(
                this.i18n.messages.errors.client
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
        applyRequestLogger(this.app, this.log)
        applyCorsIfEnabled(this.app, this.config)
        applyBodyParsers(this.app, this.config)
        this.app.use(createJsonSyntaxErrorHandler(this.i18n))
    }

    /**
     * Inicializa el servidor, controladores y rutas.
     */
    async init(): Promise<void> {
        // 0. Inicializar Core Services (New Architecture)
        const permissionGuard = new PermissionGuard(this.db, this.log)
        await permissionGuard.load()

        this.authorization = new AuthorizationService(permissionGuard, this.log)

        const transactionMapper = new TransactionMapper(this.db, this.log)
        await transactionMapper.load()

        // BO Dependencies para Executor
        const boDeps = {
            db: this.db,
            log: this.log,
            config: this.config,
            audit: this.audit,
            session: this.session,
            validator: this.validator,
            security: this.security, // Legacy support
            i18n: this.i18n,
            email: this.email
        }

        const transactionExecutor = new TransactionExecutor(boDeps)

        this.orchestrator = new TransactionOrchestrator(
            transactionMapper,
            this.authorization,
            transactionExecutor,
            this.log,
            this.audit,
            this.i18n
        )

        // 1. Instanciar Controladores
        this.authController = new AuthController({
            session: this.session,
            audit: this.audit,
            log: this.log,
            i18n: this.i18n,
        })

        this.txController = new TransactionController({
            orchestrator: this.orchestrator,
            security: this.security,
            session: this.session,
            audit: this.audit,
            config: this.config,
            i18n: this.i18n,
            log: this.log,
        })

        this.probeController = new ProbeController(this.security, this.config.app.name)

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
                clientErrors: this.i18n.messages.errors.client,
                serverErrors: this.i18n.messages.errors.server,
                log: this.log,
            })
        )

        this.initialized = true
    }

    private setupRoutes(): void {
        const router = express.Router()

        // Probes
        router.get('/health', (req, res, next) =>
            this.probeController.health(req as AppRequest, res as AppResponse)
        )
        router.get('/ready', (req, res, next) =>
            this.probeController.ready(req as AppRequest, res as AppResponse)
        )

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
            this.log.info(
                `Servidor ejecutándose en http://${this.config.app.host}:${this.config.app.port}`
            )
        )
        return this.server
    }

    async shutdown(): Promise<void> {
        return new Promise((resolve, reject) => {
            const closeServer = () => {
                if (!this.server) return Promise.resolve()
                return new Promise<void>((subResolve, subReject) => {
                    this.server?.close((err) => (err ? subReject(err) : subResolve()))
                })
            }

            closeServer()
                .then(async () => {
                    this.log.info('Cerrando conexiones de base de datos...')
                    await this.db.shutdown()
                    resolve()
                })
                .catch(reject)
        })
    }
}
