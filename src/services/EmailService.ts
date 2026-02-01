import nodemailer from 'nodemailer'
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
 * Enmascara direcciones de correo para logs seguros.
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
        this.log = deps.log
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

    async sendLoginChallenge(params: {
        to: string
        token: string
        code: string
        appName?: unknown
    }) {
        return this._send({
            to: params.to,
            subject: `${params.appName || 'App'}: Verify your login`,
            text: `Your login verification code is: ${params.code}`,
            token: params.token,
            code: params.code,
        })
    }

    async sendPasswordReset(params: {
        to: string
        token: string
        code: string
        appName?: unknown
    }) {
        return this._send({
            to: params.to,
            subject: `${params.appName || 'App'}: Password Reset`,
            text: `Use this code to reset your password: ${params.code}`,
            token: params.token,
            code: params.code,
        })
    }

    async sendEmailVerification(params: {
        to: string
        token: string
        code: string
        appName?: unknown
    }) {
        return this._send({
            to: params.to,
            subject: `${params.appName || 'App'}: Verify your email`,
            text: `Your email verification code is: ${params.code}`,
            token: params.token,
            code: params.code,
        })
    }

    async _send({
        to,
        subject,
        text,
        token,
        code,
    }: {
        to: string
        subject: string
        text: string
        token?: string
        code?: string
    }) {
        if (this.mode !== 'smtp' || !this._transport) {
            this.log.show({
                type: this.log.TYPE_INFO,
                msg: `[Email:${this.mode}] Would send email to=${to} subject="${subject}"`,
                ctx: this.logIncludeSecrets ? { to, subject, token, code } : { to, subject },
            })
            return { ok: true, mode: this.mode }
        }

        try {
            await (this._transport as { sendMail: (opts: unknown) => Promise<unknown> }).sendMail({
                from: this.from,
                to,
                subject,
                text,
            })
            return { ok: true, mode: 'smtp' }
        } catch (err: unknown) {
            this.log.show({
                type: this.log.TYPE_ERROR,
                msg: `EmailService SMTP error: ${err instanceof Error ? err.message : String(err)}`,
            })
            return { ok: false, mode: 'smtp' }
        }
    }
}
