import { IDatabase, ILogger } from '../../types/core.js'

export type TransactionRoute = {
    object_na: string
    method_na: string
}

export class TransactionMapper {
    private txMap: Map<number, TransactionRoute> = new Map()

    constructor(
        private db: IDatabase,
        private log: ILogger
    ) {}

    /**
     * Loads transaction mappings from the database.
     * Corresponds to legacy SecurityService.loadDataTx
     */
    async load(): Promise<void> {
        try {
            // Accessing raw db result rows from IDatabase simplified interface
            // Expected query: security.loadDataTx
            const result = await this.db.exe('security', 'loadDataTx', null)

            if (!result || !result.rows) {
                this.log.show({
                    type: this.log.TYPE_ERROR,
                    msg: 'TransactionMapper: loadDataTx returned no rows structure',
                })
                return
            }

            this.txMap.clear()

            for (const row of result.rows) {
                const tx = typeof row.tx_nu === 'number' ? row.tx_nu : Number(row.tx_nu)

                if (Number.isFinite(tx) && row.object_na && row.method_na) {
                    this.txMap.set(tx, {
                        object_na: row.object_na,
                        method_na: row.method_na,
                    })
                }
            }

            this.log.show({
                type: this.log.TYPE_INFO,
                msg: `TransactionMapper: Loaded ${this.txMap.size} transactions`,
            })
        } catch (err: any) {
            this.log.show({
                type: this.log.TYPE_ERROR,
                msg: `TransactionMapper.load error: ${err.message || err}`,
            })
            throw err
        }
    }

    /**
     * Resolves a transaction number to an object and method name.
     */
    resolve(tx: unknown): TransactionRoute | null {
        const key = typeof tx === 'number' ? tx : Number(tx)
        if (!Number.isFinite(key)) return null

        return this.txMap.get(key) || null
    }

    /**
     * Manually add a route (useful for testing or dynamic plugin loading)
     */
    addRoute(tx: number, route: TransactionRoute) {
        this.txMap.set(tx, route)
    }
}
