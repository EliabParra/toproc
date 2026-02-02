import { IPermissionProvider, ILogger } from '../../types/core.js'

/**
 * Servicio de Autorización.
 *
 * Responsable exclusivo de determinar si un actor (usuario/sistema) tiene permiso
 * para realizar una acción sobre un recurso.
 *
 * Evolución del antiguo SecurityService, enfocado únicamente en la "Autorización" (AuthZ),
 * delegando la orquestación de transacciones al TransactionOrchestrator.
 *
 * @class AuthorizationService
 */
export class AuthorizationService {
    private log: ILogger

    /**
     * Crea una instancia de AuthorizationService.
     *
     * @param guard - Proveedor de permisos (e.g. PermissionGuard)
     * @param log - Logger para auditoría de decisiones
     */
    constructor(
        private guard: IPermissionProvider,
        log: ILogger
    ) {
        this.log = log.child({ category: 'Authorization' })
    }

    /**
     * Inicializa el servicio cargando los permisos.
     */
    async init(): Promise<void> {
        await this.guard.load()
    }

    /**
     * Verifica si un perfil está autorizado para ejecutar un método de un objeto.
     * Registra intentos denegados para auditoría (vía log por ahora, audit service futuro).
     *
     * @param profileId - ID del perfil del usuario
     * @param objectName - Nombre del recurso/objeto
     * @param methodName - Acción/Método a ejecutar
     * @returns {boolean} true si está autorizado, false si no
     */
    isAuthorized(profileId: number, objectName: string, methodName: string): boolean {
        const authorized = this.guard.check(profileId, objectName, methodName)

        if (!authorized) {
            this.log.warn(
                `AUTHZ: Access Denied for Profile ${profileId} on ${objectName}.${methodName}`,
                { profileId, objectName, methodName }
            )
        }

        return authorized
    }
}
