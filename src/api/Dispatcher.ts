/**
 * Dispatcher - Orquestador HTTP Principal
 *
 * Punto de entrada único para todas las peticiones HTTP del framework.
 * Configura Express, middlewares de seguridad y rutas de la API.
 *
 * @module Dispatcher
 */
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

// Utilidades
import { sendInvalidParameters } from '../utils/http-responses.js'
import { redactSecretsInString } from '../utils/sanitize.js'

/**
 * Dependencias requeridas para instanciar el Dispatcher.
 */
interface DispatcherDependencies {
    config: IConfig
    log: ILogger
    security: ISecurityService
    session: ISessionService
    i18n: II18nService
    audit: IAuditService
    db: IDatabase
}

/**
 * Dispatcher principal de la API.
 *
 * Responsabilidades:
 * - Configurar middlewares de seguridad (Helmet, CORS, CSRF, Rate Limiting)
 * - Gestionar rutas de autenticación (/login, /logout)
 * - Orquestar transacciones de negocio via /toProccess
 * - Manejar errores de forma centralizada
 *
 * @example
 * ```typescript
 * const dispatcher = new Dispatcher({ config, log, security, session, i18n, audit, db })
 * await dispatcher.init()
 * dispatcher.serverOn()
 * ```
 */
export class Dispatcher {
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

    // Mensajes localizados (cache)
    private readonly serverErrors: LocalizedMessages
    private readonly clientErrors: LocalizedMessages
    private readonly successMsgs: LocalizedMessages

    // Rate limiters
    private readonly loginRateLimiter: RequestHandler
    private _toProccessRateLimiter: RequestHandler | null = null
    public readonly authPasswordResetRateLimiter: RequestHandler

    // CSRF handlers
    private readonly csrfTokenHandler: RequestHandler
    private readonly csrfProtection: RequestHandler

    /**
     * Crea una instancia del Dispatcher.
     *
     * @param deps - Dependencias necesarias para el funcionamiento
     */
    constructor(deps: DispatcherDependencies) {
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

        // Cache de mensajes localizados
        this.serverErrors = this.i18n.get('errors.server') as LocalizedMessages
        this.clientErrors = this.i18n.get('errors.client') as LocalizedMessages
        this.successMsgs = this.i18n.get('success') as LocalizedMessages

        // Configurar Express base
        this.setupExpress()

        // Inicializar CSRF handlers
        this.csrfTokenHandler = createCsrfTokenHandler({
            config: this.config,
            i18n: this.i18n,
        } as any)
        this.csrfProtection = createCsrfProtection({
            config: this.config,
            i18n: this.i18n,
        } as any)

        // Inicializar rate limiters
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

    /**
     * Configura Express con middlewares base.
     */
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
     * Inicializa el Dispatcher completamente.
     *
     * Configura:
     * - Middleware de sesión (express-session + PostgreSQL)
     * - Frontend adapters (pre y post API)
     * - Rutas de la API (/health, /ready, /csrf, /toProccess, /login, /logout)
     * - Manejador de errores final
     *
     * @throws Error si la inicialización falla
     */
    async init(): Promise<void> {
        // Aplicar middleware de sesión
        const { applySessionMiddleware } =
            await import('./http/session/apply-session-middleware.js')
        applySessionMiddleware(this.app, {
            config: this.config,
            log: this.log,
            db: this.db,
        })

        // Frontend adapters (etapa pre-API)
        await registerFrontendHosting(this.app, {
            session: { sessionExists: (req: AppRequest) => this.session.sessionExists(req) },
            stage: 'preApi',
            config: this.config,
            i18n: this.i18n,
            log: this.log,
        })

        // Rutas de la API
        this.app.get('/health', createHealthHandler({ name: this.config.app.name }))
        this.app.get('/ready', createReadyHandler(this.security))
        this.app.get('/csrf', this.csrfTokenHandler)

        this.app.post(
            '/toProccess',
            this.toProccessRateLimiter,
            this.authPasswordResetRateLimiter,
            this.csrfProtection,
            this.toProccess.bind(this)
        )
        this.app.post('/login', this.loginRateLimiter, this.csrfProtection, this.login.bind(this))
        this.app.post('/logout', this.csrfProtection, this.logout.bind(this))

        // Frontend adapters (etapa post-API)
        await registerFrontendHosting(this.app, {
            session: { sessionExists: (req: AppRequest) => this.session.sessionExists(req) },
            stage: 'postApi',
            config: this.config,
            i18n: this.i18n,
            log: this.log,
        })

        // Manejador de errores final
        this.app.use(
            createFinalErrorHandler({
                clientErrors: this.clientErrors,
                serverErrors: this.serverErrors,
                log: this.log,
            })
        )

        this.initialized = true
    }

    /**
     * Procesa una transacción de negocio.
     *
     * Flujo:
     * 1. Valida sesión y obtiene profileId
     * 2. Valida estructura del body (tx, params)
     * 3. Resuelve transacción a objectName/methodName
     * 4. Verifica permisos del perfil
     * 5. Ejecuta método via SecurityService
     * 6. Registra auditoría
     *
     * @param req - Request de Express
     * @param res - Response de Express
     */
    private async toProccess(req: AppRequest, res: AppResponse): Promise<void> {
        let effectiveProfileId: number | null = null

        try {
            // 1. Determinar profileId
            const hasSession = this.session.sessionExists(req)
            const publicProfileId = Number(this.config.auth?.publicProfileId)

            effectiveProfileId = hasSession
                ? (req.session?.profileId ?? null)
                : Number.isInteger(publicProfileId) && publicProfileId > 0
                  ? publicProfileId
                  : null

            if (!hasSession && effectiveProfileId == null) {
                res.status(this.clientErrors.login.code).send(this.clientErrors.login)
                return
            }

            // 2. Validar estructura del body
            const body = req.body
            const alerts: string[] = []

            if (!body || typeof body !== 'object' || Array.isArray(body)) {
                alerts.push(this.i18n.t('alerts.invalidBody') || 'Invalid body')
            }

            const tx = body?.tx
            if (!Number.isInteger(tx) || tx <= 0) {
                alerts.push(this.i18n.t('alerts.invalidTx') || 'Invalid tx')
            }

            const params = body?.params
            if (params !== undefined && params !== null) {
                const isValidParams =
                    typeof params === 'string' ||
                    (typeof params === 'number' && Number.isFinite(params)) ||
                    (typeof params === 'object' && !Array.isArray(params))

                if (!isValidParams) {
                    alerts.push(
                        this.i18n.t('alerts.paramsType', { value: 'params' }) || 'Invalid params'
                    )
                }
            }

            if (alerts.length > 0) {
                sendInvalidParameters(res, this.clientErrors.invalidParameters, alerts)
                return
            }

            // 3. Esperar a que SecurityService esté listo
            if (!this.security.isReady) {
                try {
                    await this.security.ready
                } catch {
                    res.status(this.clientErrors.serviceUnavailable.code).send(
                        this.clientErrors.serviceUnavailable
                    )
                    return
                }
            }

            // 4. Resolver transacción
            const txData = this.security.getDataTx(tx)
            if (!txData) {
                throw new Error(this.serverErrors.txNotFound.msg.replace('{tx}', String(tx)))
            }

            // 5. Preparar parámetros (inyectar metadata para Auth)
            let effectiveParams = params
            if (txData.objectName === 'Auth') {
                const authMethods = [
                    'register',
                    'requestEmailVerification',
                    'verifyEmail',
                    'requestPasswordReset',
                    'verifyPasswordReset',
                    'resetPassword',
                ]
                if (authMethods.includes(txData.methodName)) {
                    const baseParams =
                        params && typeof params === 'object' && !Array.isArray(params) ? params : {}
                    effectiveParams = {
                        ...baseParams,
                        _request: {
                            ip: req.ip ?? null,
                            userAgent: req.get?.('User-Agent') ?? null,
                        },
                    }
                }
            }

            const data = {
                profileId: effectiveProfileId!,
                methodName: txData.methodName,
                objectName: txData.objectName,
                params: effectiveParams,
            }

            // 6. Verificar permisos
            if (!this.security.getPermissions(data)) {
                await this.audit.log(req, {
                    action: 'tx_denied',
                    objectName: data.objectName,
                    methodName: data.methodName,
                    tx,
                    profile_id: effectiveProfileId,
                    details: { reason: 'permissionDenied' },
                })

                res.status(this.clientErrors.permissionDenied.code).send(
                    this.clientErrors.permissionDenied
                )
                return
            }

            // 7. Ejecutar método
            const response = await this.security.executeMethod(data)

            // 8. Registrar auditoría
            await this.audit.log(req, {
                action: 'tx_exec',
                objectName: data.objectName,
                methodName: data.methodName,
                tx,
                profile_id: effectiveProfileId,
                details: { responseCode: response?.code },
            })

            res.status(response.code).send(response)
        } catch (err: unknown) {
            this.handleError(req, res, err, '/toProccess', effectiveProfileId)
        }
    }

    /**
     * Procesa una petición de login.
     *
     * Delega la validación y creación de sesión al SessionManager.
     *
     * @param req - Request de Express
     * @param res - Response de Express
     */
    private async login(req: AppRequest, res: AppResponse): Promise<void> {
        try {
            await this.session.createSession(req, res)
        } catch (err: unknown) {
            this.handleError(req, res, err, '/login', null)
        }
    }

    /**
     * Procesa una petición de logout.
     *
     * Destruye la sesión activa y registra auditoría.
     *
     * @param req - Request de Express
     * @param res - Response de Express
     */
    private async logout(req: AppRequest, res: AppResponse): Promise<void> {
        try {
            // Validar body
            const body = req.body
            if (body != null && (typeof body !== 'object' || Array.isArray(body))) {
                sendInvalidParameters(res, this.clientErrors.invalidParameters, ['Invalid body'])
                return
            }

            if (this.session.sessionExists(req)) {
                await this.audit.log(req, { action: 'logout', details: {} })
                this.session.destroySession(req)
                res.status(this.successMsgs.logout.code).send(this.successMsgs.logout)
                return
            }

            res.status(this.clientErrors.login.code).send(this.clientErrors.login)
        } catch (err: unknown) {
            this.handleError(req, res, err, '/logout', null)
        }
    }

    /**
     * Maneja errores de forma centralizada.
     *
     * @param req - Request de Express
     * @param res - Response de Express
     * @param err - Error capturado
     * @param endpoint - Nombre del endpoint para logging
     * @param profileId - ID del perfil (si disponible)
     */
    private handleError(
        req: AppRequest,
        res: AppResponse,
        err: unknown,
        endpoint: string,
        profileId: number | null
    ): void {
        const status = this.clientErrors.unknown.code

        try {
            res.locals.__errorLogged = true
        } catch {
            // Ignorar errores al marcar res.locals
        }

        const errorMessage = err instanceof Error ? err.message : String(err)
        const isObj = req.body && typeof req.body === 'object' && !Array.isArray(req.body)
        const tx = isObj ? req.body.tx : undefined
        const rawTxData = tx != null ? this.security.getDataTx(tx) : null
        const txData = rawTxData && typeof rawTxData === 'object' ? rawTxData : null

        // Registrar auditoría si es /toProccess
        if (endpoint === '/toProccess') {
            this.audit
                .log(req, {
                    action: 'tx_error',
                    objectName: txData?.objectName,
                    methodName: txData?.methodName,
                    tx,
                    profile_id: profileId,
                    details: { error: errorMessage },
                })
                .catch(() => {})
        }

        // Logging
        this.log.show({
            type: this.log.TYPE_ERROR,
            msg: `${this.serverErrors.serverError.msg}, ${endpoint}: ${redactSecretsInString(errorMessage)}`,
            ctx: {
                requestId: req.requestId,
                method: req.method,
                path: req.originalUrl,
                status,
                tx,
                objectName: txData?.objectName,
                methodName: txData?.methodName,
                userId: req.session?.userId,
                profileId: req.session?.profileId,
                durationMs:
                    typeof req.requestStartMs === 'number'
                        ? Date.now() - req.requestStartMs
                        : undefined,
            },
        })

        res.status(status).send(this.clientErrors.unknown)
    }

    /**
     * Inicia el servidor HTTP.
     *
     * @throws Error si init() no fue llamado previamente
     * @returns Instancia del servidor HTTP
     */
    serverOn(): Server {
        if (!this.initialized) {
            throw new Error(
                'Dispatcher no inicializado. Ejecuta await dispatcher.init() antes de serverOn().'
            )
        }

        this.server = this.app.listen(this.config.app.port, () =>
            this.log.show({
                type: this.log.TYPE_INFO,
                msg: `Servidor ejecutándose en http://${this.config.app.host}:${this.config.app.port}`,
            })
        )

        return this.server
    }

    /**
     * Cierra el servidor HTTP de forma graceful.
     *
     * @returns Promise que resuelve cuando el servidor está cerrado
     */
    async shutdown(): Promise<void> {
        await new Promise<void>((resolve, reject) => {
            if (!this.server) return resolve()
            this.server.close((err) => (err ? reject(err) : resolve()))
        })
    }
}
