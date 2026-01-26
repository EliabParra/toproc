import { createRequire } from 'node:module'
import path from 'node:path'
import fs from 'node:fs'
import { PartialDeep } from '../utils/env.utils.js'
import { Config } from '../schemas/index.js'

const require = createRequire(import.meta.url)

/**
 * Cargador de configuración desde archivo JSON.
 *
 * Busca `src/config/config.json` de manera opcional en la ruta raíz especificada.
 */
export class FileLoader {
    static load(rootDir: string): PartialDeep<Config> {
        const configPath = path.join(rootDir, 'src', 'config', 'config.json')
        if (fs.existsSync(configPath)) {
            try {
                return require(configPath)
            } catch (err) {
                console.warn('Failed to load properties from config.json', err)
            }
        }
        return {}
    }
}
