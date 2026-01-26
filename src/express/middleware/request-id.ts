import { randomUUID } from 'node:crypto'

/**
 * Middleware para asignar un ID único a cada petición (Request ID).
 *
 * Utiliza `X-Request-Id` si viene en el header, o genera uno nuevo (UUID v4).
 * Adjunta el ID al objeto `req` y al header de respuesta.
 *
 */
export function applyRequestId(app: any) {
    app.use((req: any, res: any, next: any) => {
        const id = (req.headers?.['x-request-id'] as string) || randomUUID()
        req.requestId = id
        req.requestStartMs = Date.now()
        res.setHeader('X-Request-Id', id)
        next()
    })
}
