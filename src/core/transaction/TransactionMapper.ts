import { IDatabase, ILogger } from '../../types/core.js'

const TxQueries = {
    loadDataTx: `
        SELECT m.tx, o.object_name, m.method_name 
        FROM security.methods m 
        INNER JOIN security.objects o ON m.object_id = o.object_id
    `,
}

/**
 * Define la ruta de ejecución para una transacción.
 */
export type TransactionRoute = {
    /** Nombre del Business Object */
    objectName: string
    /** Nombre del método a ejecutar */
    methodName: string
}

/**
 * Mapeador de transacciones que resuelve códigos TX a rutas de ejecución (BO/Método).
 *
 * Mantiene un caché en memoria de la tabla `security.methods` para resolución rápida.
 * Se encarga de cargar y mantener la relación entre `tx` (código de transacción)
 * y el par `{ objectName, methodName }` que lo maneja.
 *
 * @example
 * ```typescript
 * const mapper = new TransactionMapper(db, log)
 * await mapper.load()
 * const route = mapper.resolve(100) // { objectName: 'Auth', methodName: 'login' }
 * ```
 */
export class TransactionMapper {
    private txMap: Map<number, TransactionRoute> = new Map()

    /**
     * Crea una instancia de TransactionMapper.
     *
     * @param db - Acceso a base de datos para cargar mapeos
     * @param log - Logger para diagnósticos
     */
    constructor(
        private db: IDatabase,
        private log: ILogger
    ) {}

    /**
     * Carga el mapa de transacciones desde la base de datos.
     * Ejecuta `security.loadDataTx` y puebla el caché en memoria.
     *
     * @returns {Promise<void>}
     * @throws {Error} Si hay un error de conexión o base de datos
     */
    async load(): Promise<void> {
        try {
            // Accessing raw db result rows from IDatabase simplified interface
            // Expected query: security.loadDataTx
            const result = await this.db.query(TxQueries.loadDataTx)

            if (!result || !result.rows) {
                this.log.show({
                    type: this.log.TYPE_ERROR,
                    msg: 'TransactionMapper: loadDataTx returned no rows structure',
                })
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

            this.log.show({
                type: this.log.TYPE_INFO,
                msg: `TransactionMapper: Carga exitosa de ${this.txMap.size} transacciones`,
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

    /**
     * Agrega manualmente una ruta al mapa (útil para testing o plugins).
     *
     * @param tx - Código de transacción
     * @param route - Ruta de ejecución
     */
    addRoute(tx: number, route: TransactionRoute) {
        this.txMap.set(tx, route)
    }
}
