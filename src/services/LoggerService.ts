import 'colors'
import { ILogger, IConfig, LogLevel } from '../types/core.js'

type LogEvent = {
    type: unknown
    msg?: unknown
    ctx?: unknown
}

/**
 * Implementación de Logger con soporte para diagnósticos detallados y formato JSON/Texto.
 *
 * Niveles: ERROR (0), INFO (1), DEBUG (2), WARNING (3).
 * Configurable mediante `config.log`.
 */
export class AppLogger implements ILogger {
    private minLevel: LogLevel
    private format: 'json' | 'text'
    private context: object = {}
    private useColors: boolean = true

    constructor(deps: { config: IConfig }, context: object = {}) {
        const config = deps.config
        // Default to INFO if not configured
        const levelName = (config as any).log?.minLevel?.toUpperCase() ?? 'INFO'
        this.minLevel = LogLevel[levelName as keyof typeof LogLevel] ?? LogLevel.INFO

        this.format = (config as any).log?.format ?? 'text'
        this.context = context

        // Colors only in text mode
        this.useColors = this.format === 'text'
    }

    trace(msg: string, ctx?: object): void {
        this.log(LogLevel.TRACE, msg, ctx)
    }

    debug(msg: string, ctx?: object): void {
        this.log(LogLevel.DEBUG, msg, ctx)
    }

    info(msg: string, ctx?: object): void {
        this.log(LogLevel.INFO, msg, ctx)
    }

    warn(msg: string, ctx?: object): void {
        this.log(LogLevel.WARN, msg, ctx)
    }

    error(msg: string, ctx?: object | Error): void {
        this.log(LogLevel.ERROR, msg, ctx)
    }

    critical(msg: string, ctx?: object | Error): void {
        this.log(LogLevel.CRITICAL, msg, ctx)
    }

    child(ctx: object): ILogger {
        // Create new instance with merged context
        // We pass { config: ... } to match constructor signature
        return new AppLogger(
            { config: { log: { minLevel: this.getLevelName(), format: this.format } } as any },
            { ...this.context, ...ctx }
        )
    }

    private log(level: LogLevel, msg: string, ctx?: object | Error): void {
        if (level < this.minLevel) return

        const timestamp = new Date().toISOString()
        const mergedCtx = { ...this.context, ...(ctx instanceof Error ? { error: ctx } : ctx) }
        const hasCtx = Object.keys(mergedCtx).length > 0

        if (this.format === 'json') {
            const entry = {
                time: timestamp,
                level: LogLevel[level].toLowerCase(),
                msg,
                ...(hasCtx ? { ctx: mergedCtx } : {}),
            }
            console.log(JSON.stringify(entry))
        } else {
            // Text format
            const levelLabel = LogLevel[level].padEnd(5)
            let formattedMsg = `[${timestamp}] ${levelLabel}: ${msg}`

            if (this.useColors) {
                switch (level) {
                    case LogLevel.TRACE:
                        formattedMsg = formattedMsg.gray
                        break
                    case LogLevel.DEBUG:
                        formattedMsg = formattedMsg.magenta
                        break
                    case LogLevel.INFO:
                        formattedMsg = formattedMsg.blue
                        break
                    case LogLevel.WARN:
                        formattedMsg = formattedMsg.yellow
                        break
                    case LogLevel.ERROR:
                        formattedMsg = formattedMsg.red
                        break
                    case LogLevel.CRITICAL:
                        formattedMsg = formattedMsg.bgRed.white
                        break
                }
            }

            if (hasCtx) {
                const ctxStr = JSON.stringify(mergedCtx)
                formattedMsg += ` | ${this.useColors ? ctxStr.gray : ctxStr}`
            }

            console.log(formattedMsg)
        }
    }

    private getLevelName(): string {
        return LogLevel[this.minLevel]
    }
}
