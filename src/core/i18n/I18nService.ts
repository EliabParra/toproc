import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { Config } from '../../config/schemas/index.js' // Assuming integration
import { deepMerge } from '../../config/utils/merge.utils.js'

const require = createRequire(import.meta.url)

export class I18nService {
    private locales: Record<string, any> = {}
    private defaultLocale: string

    constructor(defaultLocale: string = 'es') {
        this.defaultLocale = defaultLocale
    }

    // Load all JSON files from a locale directory
    loadLocale(locale: string, dirPath: string) {
        if (!fs.existsSync(dirPath)) return

        const files = fs.readdirSync(dirPath)
        const localeData: any = {}

        for (const file of files) {
            if (path.extname(file) !== '.json') continue
            const domain = path.basename(file, '.json') // e.g. 'auth', 'errors'

            try {
                const content = require(path.join(dirPath, file))
                // Structure: domain -> content
                // So t('auth.login.success') works if auth.json contains { login: { success: ... } }
                // OR if legacy messages were flatter, we might need adjustment.
                // Based on split: errors.json -> errors key.
                localeData[domain] = content
            } catch (err) {
                console.error(`Failed to load locale file ${file}`, err)
            }
        }

        this.locales[locale] = localeData
    }

    t(key: string, params?: Record<string, any>, locale?: string): string {
        const targetLocale = locale || this.defaultLocale
        const data = this.locales[targetLocale] || this.locales[this.defaultLocale] || {}

        const value = this.resolveKey(data, key)
        if (!value) return key // Fallback to key if not found

        if (typeof value === 'object' && value.msg) return this.interpolate(value.msg, params) // Handle { msg, code } style
        if (typeof value === 'string') return this.interpolate(value, params)

        return key
    }

    // Legacy support: returns the whole object structure (almost)
    getLegacyObject(locale?: string) {
        if (!locale) return this.locales
        return { [locale]: this.locales[locale] }
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
