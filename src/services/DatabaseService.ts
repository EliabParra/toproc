import { Pool, type PoolClient, type QueryResult, type QueryResultRow } from 'pg'
import type {
    IDatabase,
    ILogger,
    IConfig,
    II18nService,
    LocalizedMessages,
} from '../types/index.js'
import { buildParamsArray } from '../utils/sql.js'

/**
 * Servicio de Base de Datos (PostgreSQL).
 *
 * Encapsula la gestión del pool de conexiones `pg`, la ejecución de consultas
 * y el manejo centralizado de errores de base de datos.
 * Implementa la interfaz `IDatabase` para su uso en el contenedor de inyección de dependencias.
 *
 * @class DatabaseService
 * @implements {IDatabase}
 */
export class DatabaseService implements IDatabase {
    /** Pool de conexiones de PostgreSQL */
    public pool: Pool

    private log: ILogger

    /**
     * Crea una instancia de DatabaseService.
     * Inicializa el pool de conexiones con la configuración proporcionada.
     *
     * @param deps - Dependencias requeridas (config, i18n, log)
     */
    constructor(deps: { config: IConfig; i18n: II18nService; log: ILogger }) {
        const { config, i18n, log } = deps
        this.pool = new Pool(config.db)
        this.i18n = i18n
        this.log = log.child({ category: 'Database' })
    }

    private i18n: II18nService

    /**
     * Ejecuta una definición de consulta (Query Definition) o SQL crudo.
     * Este es el método preferido para ejecutar consultas en la capa de servicios.
     *
     * @template T - Tipo de las filas retornadas (por defecto `QueryResultRow`)
     * @param queryDef - String SQL directo o objeto `{ sql: string }` (común en definiciones de queries)
     * @param params - Parámetros para la consulta parametrizada ($1, $2...)
     * @returns Promesa con el resultado de la consulta (filas y metadatos)
     *
     * @example
     * ```typescript
     * // Uso con string simple
     * await db.query('SELECT * FROM users WHERE id = $1', [userId])
     *
     * // Uso con objeto de definición (Query Object)
     * await db.query(UserQueries.getById, [userId])
     * ```
     */
    async query<T extends QueryResultRow = QueryResultRow>(
        queryDef: string | { sql: string },
        params?: unknown[]
    ): Promise<QueryResult<T>> {
        let sql: string
        if (typeof queryDef === 'string') {
            sql = queryDef
        } else {
            sql = queryDef.sql
        }
        return this.exeRaw(sql, params) as Promise<QueryResult<T>>
    }

    /**
     * Ejecuta una consulta SQL cruda directamente contra el pool.
     * Maneja la obtención y liberación de clientes del pool automáticamente.
     *
     * Convierte y captura errores de base de datos para logging centralizado antes de relanzarlos.
     *
     * @param sql - Sentencia SQL a ejecutar
     * @param params - Parámetros opcionales (array, objeto o valor único)
     * @returns Promesa con el resultado crudo de `pg`
     * @throws {Error} Error decorado con código de error de base de datos si la ejecución falla
     */
    async exeRaw(sql: string, params?: unknown): Promise<QueryResult<Record<string, unknown>>> {
        let client: PoolClient | undefined
        try {
            if (typeof sql !== 'string' || sql.trim().length === 0) {
                throw new Error('exeRaw sql must be a non-empty string')
            }

            // Normalizar parámetros usando utilidad externa
            const paramsArray = buildParamsArray(params)

            client = await this.pool.connect()
            return await client.query(sql, paramsArray as unknown[])
        } catch (e: unknown) {
            // Manejo de errores centralizado
            const msg = `${this.i18n.messages.errors.server.dbError.msg}, DatabaseService.exeRaw: ${e instanceof Error ? e.message : String(e)}`

            this.log.error(msg)

            // Re-empaquetar error para mantener consistencia
            const err = new Error(this.i18n.messages.errors.server.dbError.msg) as Error & {
                code?: unknown
                cause?: unknown
            }
            err.code = this.i18n.messages.errors.server.dbError.code
            ;(err as any).cause = e

            throw err
        } finally {
            // Asegurar liberación del cliente al pool
            try {
                client?.release?.()
            } catch {}
        }
    }
    async shutdown(): Promise<void> {
        await this.pool.end()
    }
}
