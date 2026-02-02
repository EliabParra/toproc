import { IDatabase, ILogger, ITransactionMapper, TransactionRoute } from '../../types/core.js'

const TxQueries = {
    loadDataTx: `
        SELECT m.tx, o.object_name, m.method_name 
        FROM security.methods m 
        INNER JOIN security.objects o ON m.object_id = o.object_id
    `,
}

/** Row resultado de la query de transacciones */
interface TxRow {
    tx: number | string
    object_name: string
    method_name: string
    [key: string]: unknown
}

/**
 * Mapeador de transacciones que resuelve códigos TX a rutas de ejecución (BO/Método).
 *
 * Mantiene un caché en memoria de la tabla `security.methods` para resolución rápida.
 * Se encarga de cargar y mantener la relación entre `tx` (código de transacción)
 * y el par `{ objectName, methodName }` que lo maneja.
 *
 * @class TransactionMapper
 * @implements {ITransactionMapper}
 */
export class TransactionMapper implements ITransactionMapper {
    private txMap: Map<number, TransactionRoute> = new Map()
    private log: ILogger

    /**
     * Crea una instancia de TransactionMapper.
     *
     * @param db - Acceso a base de datos para cargar mapeos
     * @param log - Logger para diagnósticos
     */
    constructor(
        private db: IDatabase,
        log: ILogger
    ) {
        this.log = log.child({ category: 'TransactionMapper' })
    }

    /**
     * Carga el mapa de transacciones desde la base de datos.
     * Ejecuta `TxQueries.loadDataTx` y puebla el caché en memoria.
     *
     * @returns {Promise<void>}
     * @throws {Error} Si hay un error de conexión o base de datos
     */
    async load(): Promise<void> {
        try {
            const result = await this.db.query<TxRow>(TxQueries.loadDataTx)

            if (!result || !result.rows) {
                this.log.error('TransactionMapper: loadDataTx no retornó filas')
                return
            }

            this.txMap.clear()

            for (const row of result.rows) {
                const tx = typeof row.tx === 'number' ? row.tx : Number(row.tx)

                if (Number.isFinite(tx) && row.object_name && row.method_name) {
                    this.txMap.set(tx, {
                        objectName: row.object_name,
                        methodName: row.method_name,
                    })
                }
            }

            this.log.info(`TransactionMapper: Carga exitosa de ${this.txMap.size} transacciones`)
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err)
            this.log.error(`TransactionMapper.load error: ${msg}`)
            throw err
        }
    }

    /**
     * Resuelve un número de transacción a su ruta de ejecución.
     *
     * @param tx - Código de transacción (número o string numérico)
     * @returns {TransactionRoute | null} La ruta { objectName, methodName } o null si no existe
     */
    resolve(tx: unknown): TransactionRoute | null {
        const key = typeof tx === 'number' ? tx : Number(tx)
        if (!Number.isFinite(key)) return null

        return this.txMap.get(key) || null
    }
}
