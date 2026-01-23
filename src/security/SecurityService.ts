import { IDatabase, ILogger, ISecurityService } from '../types/core.js'

export class SecurityService implements ISecurityService {
    private db: IDatabase
    private log: ILogger

    // config is needed for BO path
    private config: any
    private msgs: any

    private permission: Map<string, true> = new Map()
    private txMap: Map<number, { object_na: string; method_na: string }> = new Map()
    private instances: Map<string, Record<string, unknown>> = new Map()

    public isReady: boolean = false
    public initError: unknown = null
    public ready: Promise<boolean>

    constructor(deps: { db: IDatabase; log: ILogger; config: any; msgs: any }) {
        this.db = deps.db
        this.log = deps.log
        this.config = deps.config
        this.msgs = deps.msgs
        this.ready = this.init()
        this.ready.catch(() => {}) // Suppress unhandled rejection
    }

    private get serverErrors() {
        return this.msgs[this.config.app.lang].errors.server
    }

    private permissionKey(profileId: number, method: string, object: string) {
        return `${profileId}_${method}_${object}`
    }

    private instanceKey(object: string, method: string) {
        return `${object}_${method}`
    }

    async init(): Promise<boolean> {
        try {
            await Promise.all([this.loadPermissions(), this.loadDataTx()])
            this.isReady = true
            return true
        } catch (err: unknown) {
            this.initError = err
            this.log.show({
                type: this.log.TYPE_ERROR,
                msg: `${this.serverErrors.serverError.msg}, SecurityService.init: ${err instanceof Error ? err.message : String(err)}`,
            })
            throw err
        }
    }

    async loadPermissions(): Promise<boolean> {
        try {
            type PermissionRow = { profile_id: number; method_na: string; object_na: string }
            const r = await this.db.exe('security', 'loadPermissions', null)
            if (!r?.rows) throw new Error('loadPermissions returned null')

            this.permission.clear()
            r.rows.forEach((el: PermissionRow) => {
                const key = this.permissionKey(el.profile_id, el.method_na, el.object_na)
                this.permission.set(key, true)
            })
            return true
        } catch (err: unknown) {
            // Log logic duplicated from original Security.ts
            this.log.show({
                type: this.log.TYPE_ERROR,
                msg: `${this.serverErrors.serverError.msg}, SecurityService.loadPermissions: ${err instanceof Error ? err.message : String(err)}`,
            })
            throw err
        }
    }

    async loadDataTx(): Promise<boolean> {
        try {
            type TxRow = { tx_nu: number | string; object_na: string; method_na: string }
            const r = await this.db.exe('security', 'loadDataTx', null)
            if (!r?.rows) throw new Error('loadDataTx returned null')

            this.txMap.clear()
            r.rows.forEach((el: TxRow) => {
                const tx = typeof el.tx_nu === 'number' ? el.tx_nu : Number(el.tx_nu)
                if (!Number.isFinite(tx)) return
                this.txMap.set(tx, { object_na: el.object_na, method_na: el.method_na })
            })
            return true
        } catch (err: unknown) {
            this.log.show({
                type: this.log.TYPE_ERROR,
                msg: `${this.serverErrors.serverError.msg}, SecurityService.loadDataTx: ${err instanceof Error ? err.message : String(err)}`,
            })
            throw err
        }
    }

    getDataTx(tx: unknown): { object_na: string; method_na: string } | false {
        const key = typeof tx === 'number' ? tx : Number(tx)
        if (!Number.isFinite(key)) return false
        return this.txMap.get(key) ?? false
    }

    getPermissions(jsonData: {
        profile_id: number
        method_na: string
        object_na: string
    }): boolean {
        const key = this.permissionKey(jsonData.profile_id, jsonData.method_na, jsonData.object_na)
        return this.permission.has(key)
    }

    async executeMethod(jsonData: {
        object_na: string
        method_na: string
        params: Record<string, unknown> | null | undefined
    }): Promise<{ code: number; msg: string; [key: string]: any }> {
        // Re-implementing the dynamic import logic
        // This logic is sensitive to file paths.

        const isModuleNotFound = (err: unknown): boolean => {
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

        const importBoModule = async (
            modulePathJs: string,
            modulePathTs: string
        ): Promise<Record<string, unknown>> => {
            try {
                return (await import(modulePathJs)) as Record<string, unknown>
            } catch (err: unknown) {
                if (!isModuleNotFound(err)) throw err
                return (await import(modulePathTs)) as Record<string, unknown>
            }
        }

        try {
            const key = this.instanceKey(jsonData.object_na, jsonData.method_na)

            if (this.instances.has(key)) {
                const instance = this.instances.get(key)
                const fn = instance?.[jsonData.method_na]
                if (typeof fn !== 'function') {
                    throw new Error(
                        `BO method not found: ${jsonData.object_na}.${jsonData.method_na}`
                    )
                }
                return await (
                    fn as (p: Record<string, unknown> | null | undefined) => Promise<any>
                )(jsonData.params)
            } else {
                const objectName = jsonData.object_na
                // config.bo.path usually is relative like "../../BO/"
                // We need to resolve it relative to CWD or __dirname?
                // The original code used `config.bo.path` assuming it works with `import()`.
                // `import()` accepts URLs or relative paths.

                // Original code:
                // const basePath = `${effectiveConfig.bo.path}${objectName}/${objectName}BO`
                // Since `effectiveConfig.bo.path` is likely `../../BO/` (relative to src/BSS/Security.ts probably, or relative to CWD?)
                // Actually `import()` with relative path is relative to the *current file*.
                // Global config `../../BO/` works if `src/BSS/Security.ts` is running.
                // My new file is `src/security/SecurityService.ts`.
                // `src/BSS` vs `src/security`. Same depth. So `../../BO/` should still work!

                const basePath = `${this.config.bo.path}${objectName}/${objectName}BO`
                const modulePathJs = `${basePath}.js`
                const modulePathTs = `${basePath}.ts`

                const mod = await importBoModule(modulePathJs, modulePathTs)
                const ctor = mod[`${objectName}BO`]
                if (typeof ctor !== 'function') {
                    throw new Error(`BO class not found: ${objectName}BO`)
                }
                const instance = new (ctor as new () => Record<string, unknown>)()

                this.instances.set(key, instance)
                const fn = instance?.[jsonData.method_na]
                if (typeof fn !== 'function') {
                    throw new Error(`BO method not found: ${objectName}.${jsonData.method_na}`)
                }
                return await (
                    fn as (p: Record<string, unknown> | null | undefined) => Promise<any>
                )(jsonData.params)
            }
        } catch (err: unknown) {
            this.log.show({
                type: this.log.TYPE_ERROR,
                msg: `${this.serverErrors.serverError.msg}, SecurityService.executeMethod: ${err instanceof Error ? err.message : String(err)}`,
                ctx: {
                    object_na: jsonData.object_na,
                    method_na: jsonData.method_na,
                    key: this.instanceKey(jsonData.object_na, jsonData.method_na),
                    modulePath: `${this.config.bo.path}${jsonData.object_na}/${jsonData.object_na}BO.js (fallback .ts)`,
                },
            })
            return this.serverErrors.serverError
        }
    }
}
