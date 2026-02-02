import { deepMerge } from '../config/utils/merge.utils.js'
import type { AppMessages } from '../locales/es.js'
import type { LocalizedMessage } from '../types/api.js'
import type { II18nService } from '../types/core.js'

/**
 * Servicio de internacionalización (I18n).
 *
 * Gestiona mensajes tipados y evita el uso de strings mágicos como keys.
 * Soporta registro de locales globales y uso de objetos de mensajes por componente.
 *
 * @class I18nService
 * @implements {II18nService}
 */
export class I18nService implements II18nService {
    private locales: Record<string, AppMessages> = {}
    private defaultLocale: string
    currentLocale: string

    /**
     * Crea una instancia de I18nService.
     * @param defaultLocale - Idioma por defecto (e.g. 'es').
     */
    constructor(defaultLocale: string = 'es') {
        this.defaultLocale = defaultLocale
        this.currentLocale = defaultLocale
    }

    /**
     * Registra un objeto de mensajes para un idioma.
     *
     * @param locale - Idioma (e.g. 'es').
     * @param messages - Objeto de mensajes (Partial<AppMessages>).
     *
     * @example
     * i18n.register('es', { alerts: { email: 'Correo inválido' } });
     */
    register(locale: string, messages: Record<string, unknown>) {
        this.locales[locale] = deepMerge(this.locales[locale] || {}, messages) as AppMessages
    }

    /**
     * Obtiene los mensajes globales para el idioma actual.
     * Si no encuentra el idioma actual, hace fallback al default.
     */
    get messages(): AppMessages {
        return (
            this.locales[this.currentLocale] ||
            this.locales[this.defaultLocale] ||
            ({} as AppMessages)
        )
    }

    /**
     * Selecciona el objeto de mensajes adecuado para el idioma actual.
     * Útil para constantes de mensajes en BOs (AuthMessages).
     *
     * @template T Tipo del set de mensajes.
     * @param messageSet - Objeto con claves por idioma { es: {...}, en: {...} }.
     * @returns El objeto de mensajes del idioma actual (NonNullable).
     *
     * @example
     * const msg = i18n.use({ es: 'Hola', en: 'Hello' });
     */
    use<T>(messageSet: Record<string, T>): NonNullable<T> {
        return (messageSet[this.currentLocale] ||
            messageSet[this.defaultLocale] ||
            messageSet['es']) as NonNullable<T>
    }

    /**
     * Interpola parámetros en un template string.
     * Reemplaza {key} con el valor correspondiente en params.
     *
     * @param template - String con placeholders {key}.
     * @param params - Objeto valores a interpolar.
     * @returns String formateado.
     *
     * @example
     * i18n.format('Hola {name}', { name: 'Juan' }); // 'Hola Juan'
     */
    format(template: string, params?: Record<string, unknown>): string {
        return this.interpolate(template, params)
    }

    /**
     * Traduce una clave a texto.
     *
     * @param key - Clave del mensaje (e.g. 'alerts.email').
     * @param params - Variables para interpolar.
     * @param locale - Idioma opcional forzado.
     */
    translate(key: string, params?: Record<string, unknown>, locale?: string): string {
        const targetLocale = locale || this.currentLocale
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data: any = this.locales[targetLocale] || this.locales[this.defaultLocale] || {}

        const value = this.resolveKey(data, key)
        if (!value) return key

        if (typeof value === 'object' && value && 'msg' in value) {
            const v = value as { msg: string }
            return this.interpolate(v.msg, params)
        }
        if (typeof value === 'string') return this.interpolate(value, params)

        return key
    }

    /**
     * Formatea una fecha según el locale actual.
     *
     * @param date - Fecha a formatear.
     * @param options - Opciones de Intl.DateTimeFormat.
     * @returns String fecha formateada.
     */
    formatDate(date: Date | number, options?: Intl.DateTimeFormatOptions): string {
        return new Intl.DateTimeFormat(this.currentLocale, options).format(date)
    }

    /**
     * Formatea una moneda según el locale actual.
     *
     * @param amount - Cantidad.
     * @param currency - Código ISO (USD, EUR, MXN).
     * @returns String moneda formateada.
     */
    formatCurrency(amount: number, currency: string): string {
        return new Intl.NumberFormat(this.currentLocale, {
            style: 'currency',
            currency,
        }).format(amount)
    }

    /**
     * Obtiene un objeto de error HTTP desde los mensajes globales.
     *
     * @param selector - Función que selecciona el error desde AppMessages['errors'].
     * @param params - Parámetros de interpolación.
     * @returns Objeto LocalizedMessage { msg, code }.
     *
     * @example
     * i18n.error(e => e.server.notFound);
     */
    error(
        selector: (msgs: AppMessages['errors']) => LocalizedMessage,
        params?: Record<string, unknown>
    ): LocalizedMessage {
        const msgs = this.messages.errors
        const err = selector(msgs)
        if (!err) return { msg: 'Unknown Error', code: 500 }

        return {
            msg: this.interpolate(err.msg, params),
            code: err.code,
        }
    }

    /**
     * Método Legacy para obtener errores por string key.
     * Mantenido para compatibilidad con código antiguo.
     */
    errorKey(key: string, params?: Record<string, unknown>): LocalizedMessage {
        const val = this.resolveKey(this.messages, key)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const v = val as any

        if (!v) return { msg: key, code: 500 }

        return {
            msg: this.interpolate(v.msg || key, params),
            code: v.code || 500,
        }
    }

    /**
     * Obtiene el valor raw de una clave.
     */
    get(key: string): unknown {
        return this.resolveKey(this.messages, key)
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private resolveKey(obj: any, key: string): unknown {
        return key.split('.').reduce((o, i) => (o ? o[i] : undefined), obj)
    }

    private interpolate(template: string, params?: Record<string, unknown>) {
        if (!params) return template
        return template.replace(/\{(\w+)\}/g, (_, k) =>
            params[k] !== undefined ? String(params[k]) : `{${k}}`
        )
    }
}
