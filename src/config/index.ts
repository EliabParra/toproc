import { EnvLoader } from './loaders/env.loader.js'
import { FileLoader } from './loaders/file.loader.js'
import { ConfigSchema, Config } from './schemas/index.js'
import { deepMerge } from './utils/merge.utils.js'
import { ZodError } from 'zod'

/**
 * Cargador principal de configuración.
 *
 * Orquesta la carga desde archivos y variables de entorno, fusiona y valida.
 * Implementa Singleton para acceso global optimizado.
 */
export class ConfigLoader {
    private static instance: Config

    static load(rootDir: string = process.cwd()): Config {
        if (this.instance) return this.instance

        // 1. Load File Config
        const fileConfig = FileLoader.load(rootDir)

        // 2. Load Env Config
        const envConfig = EnvLoader.load()

        // 3. Merge (Defaults < File < Env)
        // Note: Zod defaults handle the "Defaults" layer.
        // We pass the merged object to Zod.
        const merged = deepMerge({}, fileConfig, envConfig)

        // 4. Validate
        try {
            const result = ConfigSchema.parse(merged)
            this.instance = result
            return result
        } catch (error) {
            if (error instanceof ZodError) {
                console.error('\n❌ Invalid Configuration:')
                const zodError = error as any
                zodError.errors.forEach((err: any) => {
                    console.error(`  - ${err.path.join('.')}: ${err.message}`)
                })
                process.exit(1)
            }
            throw error
        }
    }

    static getInstance(): Config {
        if (!this.instance) throw new Error('Config not loaded. Call load() first.')
        return this.instance
    }
}
