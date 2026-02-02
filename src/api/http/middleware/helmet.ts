import helmet from 'helmet'
import { Express } from 'express'

/**
 * Aplica headers de seguridad HTTP mediante Helmet.
 *
 * Protege contra vulnerabilidades web comunes (Clickjacking, XSS, Sniffing).
 * Deshabilita Content Security Policy (CSP) por defecto para evitar roturas en frontend inline.
 *
 */
export function applyHelmet(app: Express) {
    // Kept conservative; CSP disabled to avoid breaking inline scripts in public/pages.
    app.use(helmet({ contentSecurityPolicy: false }))
}
