import nodemailer from 'nodemailer'
import fs from 'node:fs/promises'
import path from 'node:path'
import { IEmailService, IConfig, ILogger } from '../types/core.js'

function maskEmail(email: string) {
    const s = String(email ?? '').trim()
    const at = s.indexOf('@')
    if (at <= 1) return '***'
    const local = s.slice(0, at)
    const domain = s.slice(at + 1)
    const head = local.slice(0, 2)
    return `${head}***@${domain}`
}

export type EmailConfig = {
    mode?: string // 'log' | 'smtp'
    from?: string
    logIncludeSecrets?: boolean // If true, logs tokens/codes
    smtp?: {
        host: string
        port: number
        secure?: boolean
        auth?: {
            user: string
            pass: string
        }
    }
}

function isConfiguredForSmtp(cfg: EmailConfig) {
    if (cfg.mode !== 'smtp') return false
    return Boolean(cfg.smtp?.host && cfg.smtp?.port)
}

function buildTransport(cfg: EmailConfig) {
    return nodemailer.createTransport({
        host: cfg.smtp!.host,
        port: cfg.smtp!.port,
        secure: cfg.smtp!.secure ?? false,
        auth: cfg.smtp!.auth
            ? {
                  user: cfg.smtp!.auth.user,
                  pass: cfg.smtp!.auth.pass,
              }
            : undefined,
    })
}

/**
 * Servicio de envío de correos electrónicos.
 *
 * Soporta modo 'smtp' (producción) y modo 'log' (desarrollo).
 * Permite envío de texto plano y plantillas HTML con interpolación simple.
 *
 * @since 1.0.0
 * @author Team ToProccess
 * @license MIT
 */
export class EmailService implements IEmailService {
    log: ILogger
    config: IConfig
    cfg: EmailConfig
    mode: string
    from: string
    logIncludeSecrets: boolean
    _transport: unknown

    constructor(deps: { log: ILogger; config: IConfig }) {
        this.log = deps.log.child({ category: 'Email' })
        this.config = deps.config

        this.cfg = (this.config?.email ?? {}) as EmailConfig
        this.mode = String(this.cfg.mode ?? 'log')
            .trim()
            .toLowerCase()
        this.from = String(this.cfg.from ?? 'no-reply@example.com')
        this.logIncludeSecrets =
            Boolean(this.cfg.logIncludeSecrets) || process.env.NODE_ENV === 'test'

        this._transport = null
        if (this.mode === 'smtp' && isConfiguredForSmtp(this.cfg)) {
            this._transport = buildTransport(this.cfg)
        }
    }

    /**
     * Enmascara un email para logs (e.g. "el***@example.com").
     */
    maskEmail(email: string) {
        return maskEmail(email)
    }

    /**
     * Envía un correo electrónico simple.
     *
     * @param params - Opciones de envío
     * @returns Resultado del envío
     */
    async send(params: { to: string; subject: string; text?: string; html?: string }) {
        return this._sendRaw(params)
    }

    /**
     * Envía un correo utilizando una plantilla HTML.
     * Lee el archivo desde `src/templates/emails/` e interpola variables {{key}}.
     *
     * @param params - Opciones con ruta de plantilla y datos
     * @returns Resultado del envío
     */
    async sendTemplate(params: {
        to: string
        subject: string
        templatePath: string
        data: Record<string, unknown>
    }) {
        try {
            // Resolver ruta absoluta (asumiendo ejecución desde root o dist)
            // Esto es simplificado y debería robustecerse para prod/dev
            const isDist = __dirname.includes('dist')
            // Ajustar ruta base según entorno (src vs dist)
            const baseDir = isDist
                ? path.resolve(__dirname, '../../templates/emails') // dist/src/services/../../templates -> dist/src/templates
                : path.resolve(process.cwd(), 'src/templates/emails')

            const fullPath = path.join(baseDir, params.templatePath)

            let template = await fs.readFile(fullPath, 'utf-8')

            // Interpolación simple {{key}}
            for (const [key, value] of Object.entries(params.data)) {
                if (value !== undefined && value !== null) {
                    template = template.replaceAll(`{{${key}}}`, String(value))
                }
            }

            // Inyectar año actual por defecto si no existe
            const year = new Date().getFullYear()
            template = template.replaceAll('{{year}}', String(year))

            return this._sendRaw({
                to: params.to,
                subject: params.subject,
                html: template,
                text: `Please view this email in an HTML compatible viewer. content: ${JSON.stringify(params.data)}`, // Fallback básico
            })
        } catch (error) {
            this.log.error(`Error loading template ${params.templatePath}`, error as Error)
            // Fallback a texto plano si falla el template
            return this._sendRaw({
                to: params.to,
                subject: params.subject,
                text: `Error rendering template. Data: ${JSON.stringify(params.data)}`,
            })
        }
    }

    private async _sendRaw({
        to,
        subject,
        text,
        html,
    }: {
        to: string
        subject: string
        text?: string
        html?: string
    }) {
        if (this.mode !== 'smtp' || !this._transport) {
            this.log.info(
                `[Email:${this.mode}] Would send email to=${to} subject="${subject}"`,
                this.logIncludeSecrets
                    ? { to, subject, body: text ?? 'HTML Content' }
                    : { to, subject }
            )
            return { ok: true, mode: this.mode }
        }

        try {
            await (this._transport as { sendMail: (opts: unknown) => Promise<unknown> }).sendMail({
                from: this.from,
                to,
                subject,
                text,
                html,
            })
            return { ok: true, mode: 'smtp' }
        } catch (err: unknown) {
            this.log.error(
                `EmailService SMTP error: ${err instanceof Error ? err.message : String(err)}`
            )
            return { ok: false, mode: 'smtp' }
        }
    }
}
