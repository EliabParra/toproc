import { ILogger } from '../../types/core.js'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

export class TransactionExecutor {
    private instances: Map<string, Record<string, unknown>> = new Map()

    constructor(
        private config: any, // Need config.bo.path
        private log: ILogger
    ) {}

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
     * Resolve the absolute base path for a BO.
     * Uses config.bo.path relative to CWD.
     */
    private resolveBOPath(objectName: string): string {
        const boConfigPath = this.config.bo.path || '../../BO/'
        let relativePath = boConfigPath

        // Normalize 'BO' folder detection
        if (relativePath.includes('BO')) {
            relativePath = 'BO/'
        }

        return path.resolve(process.cwd(), relativePath, objectName, `${objectName}BO`)
    }

    async execute(objectName: string, methodName: string, params: any): Promise<any> {
        const key = this.instanceKey(objectName, methodName)

        if (this.instances.has(key)) {
            const instance = this.instances.get(key)
            const fn = instance?.[methodName]
            if (typeof fn !== 'function') {
                throw new Error(`BO method not found: ${objectName}.${methodName}`)
            }
            return await (fn as (p: any) => Promise<any>)(params)
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
                    throw new Error(`BO class not found: ${objectName}BO`)
                }
                const instance = new (ctor as new () => Record<string, unknown>)()

                this.instances.set(key, instance)
                const fn = instance?.[methodName]
                if (typeof fn !== 'function') {
                    throw new Error(`BO method not found: ${objectName}.${methodName}`)
                }
                return await (fn as (p: any) => Promise<any>)(params)
            } catch (err: any) {
                this.log.show({
                    type: this.log.TYPE_ERROR,
                    msg: `TransactionExecutor execution failed: ${err.message}`,
                    ctx: { objectName, methodName, path: basePath },
                })
                throw err
            }
        }
    }
}
