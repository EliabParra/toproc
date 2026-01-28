type ReadyHandlerArgs = {
    clientErrors: any
}

/**
 * Crea handler para verificación de disponibilidad (Readiness Probe).
 *
 * Verifica conectividad con BD y estado de inicialización de seguridad.
 * Retorna 200 OK si el servicio está listo para aceptar tráfico.
 *
 * @function createReadyHandler
 * @param args - Configuración ({ clientErrors })
 * @returns {Function} Express RequestHandler
 */
import { ISecurityService } from '../../../types/core.js'

/**
 * Crea handler para verificación de disponibilidad (Readiness Probe).
 *
 * Verifica conectividad con BD y estado de inicialización de seguridad.
 * Retorna 200 OK si el servicio está listo para aceptar tráfico.
 *
 * @function createReadyHandler
 * @param security - Servicio de seguridad
 * @returns {Function} Express RequestHandler
 */
export const createReadyHandler = (security: ISecurityService) => async (req: any, res: any) => {
    if (security.isReady) {
        return res.status(200).send({ status: 'ok' })
    }
    return res.status(503).send({ status: 'starting' })
}
