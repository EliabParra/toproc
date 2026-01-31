import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { deepMerge } from '../config/utils/merge.utils.js'

const require = createRequire(import.meta.url)

/**
 * Servicio de internacionalización (I18n) para mensajes multilingües.
 *
 * Carga archivos JSON de ubicación (`locales/es/*.json`) y permite
 * la interpolación de parámetros en tiempo de ejecución.
 * Soporta estructuras anidadas y objetos con propiedades { msg, code }.
 *
 *
 *
 * @example
 * ```typescript
 * const i18n = new I18nService('es')
 * i18n.loadLocale('es', './src/locales/es')
 * console.log(i18n.t('auth.login.success', { user: 'Admin' }))
 * ```
 */
export class I18nService {
    private locales: Record<string, any> = {}
    private defaultLocale: string

    /**
     * Crea una instancia de I18nService.
     *
     * @param defaultLocale - Idioma por defecto (e.g. 'es')
     */
    constructor(defaultLocale: string = 'es') {
        this.defaultLocale = defaultLocale
    }

    /**
     * Carga todos los archivos JSON de un directorio como dominios de traducción.
     *
     * @param locale - Código del idioma (e.g. 'es')
     * @param dirPath - Ruta absoluta al directorio de archivos JSON
     */
    loadLocale(locale: string, dirPath: string) {
        if (!fs.existsSync(dirPath)) return

        const files = fs.readdirSync(dirPath)
        const localeData: Record<string, any> = {}

        for (const file of files) {
            if (path.extname(file) !== '.json') continue
            const domain = path.basename(file, '.json') // e.g. 'auth', 'errors'

            try {
                const content = require(path.join(dirPath, file))
                // Structure: domain -> content
                // So t('auth.login.success') works if auth.json contains { login: { success: ... } }
                localeData[domain] = content
            } catch (err) {
                console.error(`Error cargando archivo de locale ${file}`, err)
            }
        }

        this.locales[locale] = localeData
    }

    /**
     * Traduce una clave y opcionalmente interpola parámetros.
     *
     * @param key - Clave de traducción (e.g. 'auth.login.success')
     * @param params - Objeto con valores para reemplazar {variable}
     * @param locale - Idioma opcional (usa default si se omite)
     * @returns {string} Mensaje traducido o la clave si no existe
     */
    t(key: string, params?: Record<string, any>, locale?: string): string {
        const targetLocale = locale || this.defaultLocale
        const data = this.locales[targetLocale] || this.locales[this.defaultLocale] || {}

        const value = this.resolveKey(data, key)
        if (!value) return key // Fallback to key if not found

        if (typeof value === 'object' && value.msg) return this.interpolate(value.msg, params) // Handle { msg, code } style
        if (typeof value === 'string') return this.interpolate(value, params)

        return key
    }

    /**
     * Obtiene un objeto de error HTTP con código y mensaje traducido.
     * Diseñado para errores que requieren código HTTP (e.g. { msg, code }).
     *
     * @param key - Clave de error (e.g. 'errors.server.notFound')
     * @param params - Parámetros de interpolación opcionales
     * @param locale - Idioma opcional
     * @returns {{ msg: string, code: number }} Objeto de error HTTP
     *
     * @example
     * ```typescript
     * const err = i18n.error('errors.server.dbError')
     * // { msg: 'Error al consultar la base de datos', code: 500 }
     * res.status(err.code).json(err)
     * ```
     */
    error(
        key: string,
        params?: Record<string, any>,
        locale?: string
    ): { msg: string; code: number } {
        const targetLocale = locale || this.defaultLocale
        const data = this.locales[targetLocale] || this.locales[this.defaultLocale] || {}

        const value = this.resolveKey(data, key)
        if (!value || typeof value !== 'object') {
            return { msg: key, code: 500 }
        }

        return {
            msg: this.interpolate(value.msg || key, params),
            code: value.code || 500,
        }
    }

    /**
     * Obtiene un objeto completo de una clave (útil para estructuras anidadas).
     *
     * @param key - Clave de acceso (e.g. 'errors.server')
     * @param locale - Idioma opcional
     * @returns {any} Objeto o valor de la clave
     */
    get(key: string, locale?: string): any {
        const targetLocale = locale || this.defaultLocale
        const data = this.locales[targetLocale] || this.locales[this.defaultLocale] || {}
        return this.resolveKey(data, key)
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
