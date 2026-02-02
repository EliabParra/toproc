import { randomUUID } from 'node:crypto'
import { Express, NextFunction } from 'express'
import { AppRequest, AppResponse } from '../../../types/index.js'

/**
 * Middleware para asignar y trazar un ID único por petición (Request ID).
 *
 * Responsabilidades:
 * 1. Genera un UUID v4 o respeta el header `X-Request-Id` entrante.
 * 2. Asigna el ID al objeto `req` y al header de respuesta.
 * 3. **Inicia el contexto global de logging** (`AsyncLocalStorage`) para que todos los logs
 *    subsiguientes incluyan este ID automáticamente.
 *
 * @param app - Instancia de la aplicación Express.
 */
import { loggerContext } from '../../../services/LoggerService.js'

export function applyRequestId(app: Express) {
    app.use((req: AppRequest, res: AppResponse, next: NextFunction) => {
        const id = (req.headers?.['x-request-id'] as string) || randomUUID()
        req.requestId = id
        req.requestStartMs = Date.now()
        res.setHeader('X-Request-Id', id)

        loggerContext.run({ requestId: id }, () => {
            next()
        })
    })
}
