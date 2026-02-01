import { BODependencies } from '../../types/core.js'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

/**
 * Ejecutor de transacciones que carga e instancia dinámicamente Business Objects.
 *
 * Se encarga de:
 * 1. Resolver la ruta del archivo BO
 * 2. Cargar el módulo (soporte ESM/TS)
 * 3. Instanciar el BO
 * 4. Ejecutar el método solicitado
 * 5. Cachear instancias para optimizar rendimiento
 *
 *
 * @example
 * ```typescript
 * const executor = new TransactionExecutor(deps)
 * const result = await executor.execute('User', 'get', { id: 1 })
 * ```
 */
export class TransactionExecutor {
    private instances: Map<string, Record<string, unknown>> = new Map()

    /**
     * Crea una instancia de TransactionExecutor.
     *
     * @param deps - Dependencias de negocio (BODependencies)
     */
    constructor(private deps: BODependencies) {}

    private instanceKey(object: string, method: string) {
        return `${object}_${method}`
    }

    private isModuleNotFound(err: unknown): boolean {
        const code =
            err && typeof err === 'object' && 'code' in err
                ? (err as { code?: unknown }).code
                : undefined
        if (code === 'ERR_MODULE_NOT_FOUND') return true
        const msg =
            err && typeof err === 'object' && 'message' in err
                ? String((err as { message?: unknown }).message ?? '')
                : ''
        return msg.includes('Cannot find module') || msg.includes('ERR_MODULE_NOT_FOUND')
    }

    private async importBoModule(
        modulePathJs: string,
        modulePathTs: string
    ): Promise<Record<string, unknown>> {
        try {
            return (await import(modulePathJs)) as Record<string, unknown>
        } catch (err: unknown) {
            if (!this.isModuleNotFound(err)) throw err
            return (await import(modulePathTs)) as Record<string, unknown>
        }
    }

    /**
     * Resuelve la ruta base absoluta para un Business Object.
     * Usa config.bo.path relativo al CWD.
     * @param objectName - Nombre del objeto (e.g. "User")
     * @returns {string} Ruta absoluta sin extensión
     */
    private resolveBOPath(objectName: string): string {
        const boConfigPath = this.deps.config.bo.path || '../../BO/'
        let relativePath = boConfigPath

        // Normalize 'BO' folder detection
        if (relativePath.includes('BO')) {
            relativePath = 'BO/'
        }

        return path.resolve(process.cwd(), relativePath, objectName, `${objectName}BO`)
    }

    /**
     * Ejecuta dinámicamente un método de un Business Object.
     *
     * @param objectName - Nombre del Business Object (e.g. "User")
     * @param methodName - Nombre del método a ejecutar (e.g. "get")
     * @param params - Parámetros para el método
     * @returns {Promise<any>} Resultado de la ejecución del método
     * @throws {Error} Si no encuentra el módulo, clase o método
     */
    async execute(
        objectName: string,
        methodName: string,
        params: Record<string, unknown> | null | undefined
    ): Promise<unknown> {
        const key = this.instanceKey(objectName, methodName)

        if (this.instances.has(key)) {
            const instance = this.instances.get(key)
            if (typeof instance?.[methodName] !== 'function') {
                throw new Error(`Método de BO no encontrado: ${objectName}.${methodName}`)
            }
            return await (instance as any)[methodName](params)
        } else {
            const basePath = this.resolveBOPath(objectName)

            // Convert file path to URL for ESM import compatibility on Windows
            const baseUrl = pathToFileURL(basePath).href
            const modulePathJs = `${baseUrl}.js`
            const modulePathTs = `${baseUrl}.ts`

            try {
                const mod = await this.importBoModule(modulePathJs, modulePathTs)
                const ctor = mod[`${objectName}BO`]
                if (typeof ctor !== 'function') {
                    throw new Error(`Clase de BO no encontrada: ${objectName}BO`)
                }
                // Inyección automática de dependencias (Phase 4)
                const instance = new (ctor as new (
                    deps: BODependencies
                ) => Record<string, unknown>)(this.deps)

                this.instances.set(key, instance)
                return await (instance as any)[methodName](params)
            } catch (err: any) {
                this.deps.log.show({
                    type: this.deps.log.TYPE_ERROR,
                    msg: `Fallo en ejecución de TransactionExecutor: ${err.message}`,
                    ctx: { objectName, methodName, path: basePath },
                })
                throw err
            }
        }
    }
}
