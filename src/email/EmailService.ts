import nodemailer from 'nodemailer'
import { ILogger, IConfig, IEmailService } from '../types/core.js'

type EmailConfig = {
    mode?: string
    from?: string
    logIncludeSecrets?: boolean
    smtpHost?: string
    smtpPort?: number
    smtpSecure?: boolean
    smtpUser?: string
    smtpPass?: string
}

type LoginEmailArgs = { to: string; token: string; code: string; appName?: unknown }
type EmailResult = { ok: boolean; mode: string }

function isConfiguredForSmtp(emailCfg: EmailConfig) {
    return Boolean(
        emailCfg &&
        typeof emailCfg.smtpHost === 'string' &&
        emailCfg.smtpHost.length > 0 &&
        Number.isInteger(emailCfg.smtpPort) &&
        Number(emailCfg.smtpPort) > 0
    )
}

function maskEmail(email: string) {
    const s = String(email ?? '').trim()
    const at = s.indexOf('@')
    if (at <= 1) return '***'
    const local = s.slice(0, at)
    const domain = s.slice(at + 1)
    const head = local.slice(0, 2)
    return `${head}***@${domain}`
}

function buildTransport(emailCfg: EmailConfig) {
    return nodemailer.createTransport({
        host: emailCfg.smtpHost,
        port: emailCfg.smtpPort,
        secure: Boolean(emailCfg.smtpSecure),
        auth:
            emailCfg.smtpUser && emailCfg.smtpPass
                ? { user: emailCfg.smtpUser, pass: emailCfg.smtpPass }
                : undefined,
    })
}

export class EmailService implements IEmailService {
    private log: ILogger
    private config: IConfig

    cfg: EmailConfig
    mode: string
    from: string
    logIncludeSecrets: boolean
    _transport: any

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

    maskEmail(email: string) {
        return maskEmail(email)
    }

    async sendLoginChallenge({ to, token, code, appName }: LoginEmailArgs): Promise<EmailResult> {
        const subject = `${String(appName ?? 'App')} - Verificación de inicio de sesión`
        const text = `Tu inicio de sesión requiere verificación.\n\nToken: ${token}\nCódigo: ${code}\n\nSi no fuiste tú, ignora este mensaje.`

        if (this.mode !== 'smtp' || !this._transport) {
            this.log.show({
                type: this.log.TYPE_INFO,
                msg: `[Email:${this.mode}] Would send login challenge to=${to} subject=${subject}`,
                ctx: this.logIncludeSecrets ? { to, subject, token, code } : { to, subject },
            })
            return { ok: true, mode: this.mode }
        }

        await this._transport.sendMail({ from: this.from, to, subject, text })
        return { ok: true, mode: 'smtp' }
    }

    async sendPasswordReset({ to, token, code, appName }: LoginEmailArgs): Promise<EmailResult> {
        const subject = `${String(appName ?? 'App')} - Restablecer contraseña`
        const text = `Solicitud para restablecer contraseña.\n\nToken: ${token}\nCódigo: ${code}\n\nSi no fuiste tú, ignora este mensaje.`

        if (this.mode !== 'smtp' || !this._transport) {
            this.log.show({
                type: this.log.TYPE_INFO,
                msg: `[Email:${this.mode}] Would send password reset to=${to} subject=${subject}`,
                ctx: this.logIncludeSecrets ? { to, subject, token, code } : { to, subject },
            })
            return { ok: true, mode: this.mode }
        }

        await this._transport.sendMail({ from: this.from, to, subject, text })
        return { ok: true, mode: 'smtp' }
    }

    async sendEmailVerification({
        to,
        token,
        code,
        appName,
    }: LoginEmailArgs): Promise<EmailResult> {
        const subject = `${String(appName ?? 'App')} - Verificar email`
        const text = `Verificación de email requerida.\n\nToken: ${token}\nCódigo: ${code}\n\nSi no fuiste tú, ignora este mensaje.`

        if (this.mode !== 'smtp' || !this._transport) {
            this.log.show({
                type: this.log.TYPE_INFO,
                msg: `[Email:${this.mode}] Would send email verification to=${to} subject=${subject}`,
                ctx: this.logIncludeSecrets ? { to, subject, token, code } : { to, subject },
            })
            return { ok: true, mode: this.mode }
        }

        await this._transport.sendMail({ from: this.from, to, subject, text })
        return { ok: true, mode: 'smtp' }
    }
}
