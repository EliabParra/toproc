import { deepMerge } from '../config/utils/merge.utils.js'
import type { AppMessages } from '../locales/es.js'

/**
 * Servicio de internacionalización (I18n).
 *
 * Gestiona mensajes tipados y evita el uso de strings mágicos como keys.
 * Soporta registro de locales globales y uso de objetos de mensajes por componente.
 */
export class I18nService {
    private locales: Record<string, any> = {}
    private defaultLocale: string
    currentLocale: string

    /**
     * Crea una instancia de I18nService.
     * @param defaultLocale - Idioma por defecto (e.g. 'es')
     */
    constructor(defaultLocale: string = 'es') {
        this.defaultLocale = defaultLocale
        this.currentLocale = defaultLocale
    }

    /**
     * Registra un objeto de mensajes para un idioma.
     * @param locale - Idioma (e.g. 'es')
     * @param messages - Objeto de mensajes
     */
    register(locale: string, messages: Record<string, any>) {
        this.locales[locale] = deepMerge(this.locales[locale] || {}, messages)
    }

    /**
     * Obtiene los mensajes globales para el idioma actual.
     */
    get messages(): AppMessages {
        return (this.locales[this.currentLocale] ||
            this.locales[this.defaultLocale] ||
            {})
    }

    /**
     * Selecciona el objeto de mensajes adecuado para el idioma actual.
     * Útil para constantes de mensajes en BOs (AuthMessages).
     *
     * @param messageSet - Objeto con claves por idioma { es: {...}, en: {...} }
     * @returns El objeto de mensajes del idioma actual
     */
    use<T>(messageSet: Record<string, T>): NonNullable<T> {
        return (messageSet[this.currentLocale] ||
            messageSet[this.defaultLocale] ||
            messageSet['es']) as NonNullable<T>
    }

    /**
     * Interpola parámetros en un string.
     * Alias público de interpolate.
     */
    format(template: string, params?: Record<string, any>): string {
        return this.interpolate(template, params)
    }

    /**
     * @deprecated Usar `i18n.messages` o `i18n.use()` para acceso tipado.
     * Traduce una clave string (soporte legacy/dinámico).
     */
    t(key: string, params?: Record<string, any>, locale?: string): string {
        const targetLocale = locale || this.currentLocale
        const data = this.locales[targetLocale] || this.locales[this.defaultLocale] || {}

        const value = this.resolveKey(data, key)
        if (!value) return key

        if (typeof value === 'object' && value.msg) return this.interpolate(value.msg, params)
        if (typeof value === 'string') return this.interpolate(value, params)

        return key
    }

    /**
     * Obtiene un objeto de error HTTP desde los mensajes globales.
     * @param selector - Función que selecciona el error desde AppMessages
     * @param params - Parámetros de interpolación
     */
    error(
        selector: (msgs: AppMessages['errors']) => { msg: string; code: number },
        params?: Record<string, any>
    ): { msg: string; code: number } {
        const msgs = this.messages.errors
        const err = selector(msgs)
        if (!err) return { msg: 'Unknown Error', code: 500 }

        return {
            msg: this.interpolate(err.msg, params),
            code: err.code,
        }
    }

    // Legacy string-key error accessor (to avoid breaking everything at once)
    errorKey(key: string, params?: Record<string, any>): { msg: string; code: number } {
        // Re-implement simplified legacy lookup if needed, or map to keys
        // For now, let's keep basic lookup for legacy compatibility
        const val = this.resolveKey(this.messages, key)
        if (!val) return { msg: key, code: 500 }
        return {
            msg: this.interpolate(val.msg || key, params),
            code: val.code || 500,
        }
    }

    get(key: string): string {
        return this.resolveKey(this.messages, key)
    }

    private resolveKey(obj: any, key: string) {
        return key.split('.').reduce((o, i) => (o ? o[i] : undefined), obj)
    }

    private interpolate(template: string, params?: Record<string, any>) {
        if (!params) return template
        return template.replace(/\{(\w+)\}/g, (_, k) =>
            params[k] !== undefined ? String(params[k]) : `{${k}}`
        )
    }
}
