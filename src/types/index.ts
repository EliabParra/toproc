/**
 * Barrel file para tipos del framework.
 *
 * Re-exporta todos los tipos desde un punto de entrada único.
 *
 * @module types
 */

// Tipos de API y respuestas
export type {
    LocalizedMessage,
    LocalizedMessages,
    ApiResponse,
    ApiSuccess,
    ApiError,
    ValidationError,
    ValidationSuccess,
    ValidationFailure,
    ValidationResult,
} from './api.js'

// Tipos HTTP y Express
export type {
    AppRequest,
    AppResponse,
    LoginRequestBody,
    ToProccessRequestBody,
    SessionUser,
} from './http.js'

// Tipos de configuración
export type {
    AppConfig,
    DbConfig,
    SessionConfig,
    CorsConfig,
    LogConfig,
    AuthConfig,
    EmailConfig,
    BoConfig,
    IAppConfig,
} from './config.js'

// Interfaces de servicios core
export type {
    ILogger,
    IValidator,
    II18nService,
    IDatabase,
    IConfig,
    ISecurityService,
    ISessionService,
    IEmailService,
    IContainer,
    IAuditService,
    BODependencies,
    SessionResult,
    TxKey,
    AppMessages,
    ITransactionMapper,
    ITransactionExecutor,
    TransactionRoute,
    IPermissionProvider,
    ISecurityContext,
} from './core.js'
