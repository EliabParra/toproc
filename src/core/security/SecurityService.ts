import { IDatabase, ILogger, ISecurityService } from '../../types/core.js'
import { TransactionMapper } from '../transaction/TransactionMapper.js'
import { PermissionGuard } from './PermissionGuard.js'
import { TransactionExecutor } from '../transaction/TransactionExecutor.js'

export class SecurityService implements ISecurityService {
    private mapper: TransactionMapper
    private guard: PermissionGuard
    private executor: TransactionExecutor

    // config/msgs/log needed for error handling/responses
    private config: any
    private msgs: any
    private log: ILogger

    public isReady: boolean = false
    public ready: Promise<boolean>

    constructor(deps: { db: IDatabase; log: ILogger; config: any; msgs: any }) {
        this.log = deps.log
        this.config = deps.config
        this.msgs = deps.msgs

        // Initialize sub-components
        this.mapper = new TransactionMapper(deps.db, deps.log)
        this.guard = new PermissionGuard(deps.db, deps.log)
        this.executor = new TransactionExecutor(deps.config, deps.log)

        this.ready = this.init()
        this.ready.catch(() => {})
    }

    private get serverErrors() {
        return this.msgs[this.config.app.lang].errors.server
    }

    async init(): Promise<boolean> {
        try {
            await Promise.all([this.guard.load(), this.mapper.load()])
            this.isReady = true
            return true
        } catch (err: unknown) {
            this.log.show({
                type: this.log.TYPE_ERROR,
                msg: `${this.serverErrors.serverError.msg}, SecurityService.init: ${err instanceof Error ? err.message : String(err)}`,
            })
            throw err
        }
    }

    getDataTx(tx: unknown): { object_na: string; method_na: string } | false {
        const route = this.mapper.resolve(tx)
        return route || false
    }

    getPermissions(jsonData: {
        profile_id: number
        method_na: string
        object_na: string
    }): boolean {
        return this.guard.check(jsonData.profile_id, jsonData.object_na, jsonData.method_na)
    }

    async executeMethod(jsonData: {
        object_na: string
        method_na: string
        params: Record<string, unknown> | null | undefined
    }): Promise<{ code: number; msg: string; [key: string]: any }> {
        try {
            return await this.executor.execute(
                jsonData.object_na,
                jsonData.method_na,
                jsonData.params
            )
        } catch (err: unknown) {
            this.log.show({
                type: this.log.TYPE_ERROR,
                msg: `${this.serverErrors.serverError.msg}, SecurityService.executeMethod: ${err instanceof Error ? err.message : String(err)}`,
                ctx: {
                    object_na: jsonData.object_na,
                    method_na: jsonData.method_na,
                },
            })
            return this.serverErrors.serverError
        }
    }
}
