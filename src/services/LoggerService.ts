import 'colors'
import { ILogger, IConfig, LogLevel } from '../types/core.js'
import { AsyncLocalStorage } from 'node:async_hooks'

export const loggerContext = new AsyncLocalStorage<object>()

/**
 * Implementación de Logger con soporte para diagnósticos detallados y formato JSON/Texto.
 *
 * Soporta niveles de log estructurados, coloreado en consola, y seguimiento de contexto
 * global mediante `AsyncLocalStorage` (trazabilidad de Request ID).
 *
 * Niveles jerárquicos: ERROR (50), WARN (40), INFO (30), DEBUG (20), TRACE (10).
 * Configurable mediante `config.log`.
 */
export class AppLogger implements ILogger {
    private minLevel: LogLevel
    private format: 'json' | 'text' | 'pretty'
    private context: object = {}
    private useColors: boolean = true
    private categories: Record<string, LogLevel> = {}

    /**
     * Crea una nueva instancia de AppLogger.
     *
     * @param deps - Dependencias necesarias (configuración).
     * @param context - Contexto inicial persistente para este logger.
     */
    constructor(deps: { config: IConfig }, context: object = {}) {
        const config = deps.config
        // Default to INFO if not configured
        const levelName = config.log.minLevel?.toUpperCase() ?? 'INFO'
        this.minLevel = LogLevel[levelName as keyof typeof LogLevel] ?? LogLevel.INFO

        this.format = config.log.format ?? 'text'
        this.context = context

        // Load categories
        const categories = config.log.categories ?? {}
        for (const [cat, level] of Object.entries(categories)) {
            const lvl = LogLevel[(level as string).toUpperCase() as keyof typeof LogLevel]
            if (lvl !== undefined) {
                this.categories[cat] = lvl
            }
        }

        // Colors only in text mode
        this.useColors = this.format === 'text'
    }

    /**
     * Registra un mensaje de nivel TRACE.
     * Útil para detalles granulares del flujo de ejecución (bucles, variables temporales).
     *
     * @param msg - Mensaje de texto principal.
     * @param ctx - Datos adicionales de contexto (metadatos).
     */
    trace(msg: string, ctx?: object): void {
        this.log(LogLevel.TRACE, msg, ctx)
    }

    /**
     * Registra un mensaje de nivel DEBUG.
     * Información diagnóstica para desarrolladores.
     *
     * @param msg - Mensaje descriptivo.
     * @param ctx - Contexto relevante.
     */
    debug(msg: string, ctx?: object): void {
        this.log(LogLevel.DEBUG, msg, ctx)
    }

    /**
     * Registra un mensaje de nivel INFO.
     * Eventos normales del ciclo de vida de la aplicación (inicio, operaciones exitosas).
     *
     * @param msg - Mensaje informativo.
     * @param ctx - Contexto adicional.
     */
    info(msg: string, ctx?: object): void {
        this.log(LogLevel.INFO, msg, ctx)
    }

    /**
     * Registra un mensaje de nivel WARN.
     * Situaciones anómalas que no interrumpen el servicio (ej. reintentos, datos faltantes no críticos).
     *
     * @param msg - Advertencia.
     * @param ctx - Contexto del problema.
     */
    warn(msg: string, ctx?: object): void {
        this.log(LogLevel.WARN, msg, ctx)
    }

    /**
     * Registra un mensaje de nivel ERROR.
     * Fallos en operaciones que requieren atención pero no detienen el proceso completo (nivel request).
     *
     * @param msg - Descripción del error.
     * @param ctx - Objeto de error o contexto adicional.
     */
    error(msg: string, ctx?: object | Error): void {
        this.log(LogLevel.ERROR, msg, ctx)
    }

    /**
     * Registra un mensaje de nivel CRITICAL.
     * Errores fatales que comprometen la estabilidad del sistema o requieren intervención inmediata.
     *
     * @param msg - Descripción del error crítico.
     * @param ctx - Error o contexto asociado.
     */
    critical(msg: string, ctx?: object | Error): void {
        this.log(LogLevel.CRITICAL, msg, ctx)
    }

    /**
     * Crea un logger hijo con contexto heredado y extendido.
     *
     * @param ctx - Contexto adicional a mezclar con el contexto actual.
     * @returns Nueva instancia de ILogger con el contexto fusionado.
     */
    child(ctx: object): ILogger {
        // Create new instance with merged context
        // We pass { config: ... } to match constructor signature
        return new AppLogger(
            {
                config: {
                    log: {
                        minLevel: this.getLevelName(),
                        format: this.format,
                        categories: Object.fromEntries(
                            Object.entries(this.categories).map(([k, v]) => [
                                k,
                                LogLevel[v].toLowerCase(),
                            ])
                        ) as any,
                    },
                } as any,
            },
            { ...this.context, ...ctx }
        )
    }

    /**
     * Método interno de escritura de logs.
     * Filtra por nivel, aplica formato (JSON/Texto) y colores, y escribe en stdout.
     */
    private log(level: LogLevel, msg: string, ctx?: object | Error): void {
        let minLevel = this.minLevel

        // Merge ALS context
        const store = loggerContext.getStore() || {}
        const mergedCtx = {
            ...this.context,
            ...store,
            ...(ctx instanceof Error ? { error: ctx } : ctx),
        }

        // Check for category override
        const category = (mergedCtx as any).category
        if (category && this.categories[category] !== undefined) {
            minLevel = this.categories[category]
        }

        if (level < minLevel) return

        const timestamp = new Date().toISOString()
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
