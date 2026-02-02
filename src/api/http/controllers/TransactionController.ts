import {
    ISecurityService,
    ISessionService,
    IAuditService,
    IConfig,
    II18nService,
    AppRequest,
    AppResponse,
    LocalizedMessages,
    ILogger,
} from '../../../types/index.js'
import { sendInvalidParameters } from '../../../utils/http-responses.js'

/**
 * Dependencias del controlador de transacciones.
 */
interface TransactionControllerDeps {
    security: ISecurityService
    session: ISessionService
    audit: IAuditService
    config: IConfig
    i18n: II18nService
    log: ILogger
}

/**
 * Controlador de Transacciones de Negocio.
 *
 * Maneja el endpoint principal `/toProccess` que orquesta la ejecución
 * de métodos de negocio (BOs) basada en códigos de transacción (TX).
 */
export class TransactionController {
    private security: ISecurityService
    private session: ISessionService
    private audit: IAuditService
    private config: IConfig
    private i18n: II18nService

    constructor(deps: TransactionControllerDeps) {
        this.security = deps.security
        this.session = deps.session
        this.audit = deps.audit
        this.config = deps.config
        this.i18n = deps.i18n
        this.i18n = deps.i18n
    }

    /**
     * Procesa una transacción de negocio.
     *
     * @param req - Request de Express
     * @param res - Response de Express
     * @param next - Función next
     */
    async handle(req: AppRequest, res: AppResponse, next: Function): Promise<void> {
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
                res.status(this.i18n.messages.errors.client.login.code).send(
                    this.i18n.messages.errors.client.login
                )
                return
            }

            // 2. Validar estructura del body
            const body = req.body
            const alerts: string[] = []

            if (!body || typeof body !== 'object' || Array.isArray(body)) {
                alerts.push(this.i18n.messages.alerts.invalidBody || 'Invalid body')
            }

            const tx = body?.tx
            if (!Number.isInteger(tx) || tx <= 0) {
                alerts.push(this.i18n.messages.alerts.invalidTx || 'Invalid tx')
            }

            const params = body?.params
            if (params !== undefined && params !== null) {
                const isValidParams =
                    typeof params === 'string' ||
                    (typeof params === 'number' && Number.isFinite(params)) ||
                    (typeof params === 'object' && !Array.isArray(params))

                if (!isValidParams) {
                    alerts.push(
                        this.i18n.format(this.i18n.messages.alerts.paramsType, {
                            value: 'params',
                        }) || 'Invalid params'
                    )
                }
            }

            if (alerts.length > 0) {
                sendInvalidParameters(
                    res,
                    this.i18n.messages.errors.client.invalidParameters,
                    alerts
                )
                return
            }

            // 3. Esperar a que SecurityService esté listo
            if (!this.security.isReady) {
                try {
                    await this.security.ready
                } catch {
                    res.status(this.i18n.messages.errors.client.serviceUnavailable.code).send(
                        this.i18n.messages.errors.client.serviceUnavailable
                    )
                    return
                }
            }

            // 4. Resolver transacción
            const txData = this.security.getDataTx(tx)
            if (!txData) {
                throw new Error(
                    this.i18n.messages.errors.server.txNotFound.msg.replace('{tx}', String(tx))
                )
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

                res.status(this.i18n.messages.errors.client.permissionDenied.code).send(
                    this.i18n.messages.errors.client.permissionDenied
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
            // Pasamos info extra al Error Handler global si es posible,
            // pero next(err) es lo estándar.
            // Para mantener el log context rico del Dispatcher original,
            // podríamos adjuntar props al error o req, pero por ahora
            // confiamos en el `final-error-handler` que ya mejoramos.

            // Replicamos la logica de "profileId" para el error handler
            // Quizas poniendolo en req.session o req.locals?
            // El error handler lee req.session.profileId.
            // Si effectiveProfileId es distinto al de session (public),
            // el error handler original lo recibía como argumento.
            // TODO: Mejorar esto. Por ahora next(err).
            next(err)
        }
    }
}
