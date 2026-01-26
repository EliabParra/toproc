type HealthHandlerArgs = {
    name: string
}

/**
 * Crea un handler para verificación de salud (Liveness Probe).
 *
 * Retorna 200 OK si el proceso de Node.js está respondiendo.
 * No verifica base de datos ni dependencias externas (ver createReadyHandler).
 *
 * @function createHealthHandler
 * @param args - Configuración ({ name })
 * @returns {Function} Express RequestHandler
 */
export function createHealthHandler({ name }: HealthHandlerArgs) {
    return function health(req: AppRequest, res: AppResponse) {
        return res.status(200).send({
            ok: true,
            name,
            uptimeSec: Math.round(process.uptime()),
            time: new Date().toISOString(),
            requestId: req.requestId,
        })
    }
}
