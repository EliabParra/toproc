import { Pool, type PoolClient, type QueryResult, type QueryResultRow } from 'pg'
import { IDatabase, ILogger, IConfig, II18nService } from '../types/core.js'

export type NamedParamsOptions = {
    strict?: boolean
    enforceSqlArity?: boolean
}

/**
 * Calcula el índice máximo de parámetro ($N) en una consulta SQL.
 *
 * @param sql - Consulta SQL
 * @returns {number} El índice más alto encontrado (e.g. 3 para $3)
 */
export function sqlMaxParamIndex(sql: unknown) {
    if (typeof sql !== 'string') return 0
    let max = 0
    const re = /\$(\d+)/g
    let m: RegExpExecArray | null
    while ((m = re.exec(sql)) != null) {
        const n = Number(m[1])
        if (Number.isInteger(n) && n > max) max = n
    }
    return max
}

function isPlainObject(val: unknown): val is Record<string, unknown> {
    return val !== null && typeof val === 'object' && !Array.isArray(val)
}

/**
 * Convierte diferentes formatos de parámetros a un array plano para pg.
 *
 * @param params - Parámetros (array, objeto, o valor simple)
 * @returns {unknown[]} Array de parámetros
 */
export function buildParamsArray(params: unknown): unknown[] {
    if (params == null) return []
    const paramsArray: unknown[] = []
    if (Array.isArray(params)) paramsArray.push(...params)
    else if (isPlainObject(params)) for (const attr in params) paramsArray.push(params[attr])
    else paramsArray.push(params)
    return paramsArray
}

/**
 * Prepara parámetros nombrados para una consulta SQL.
 * Valida que todos los keys requeridos estén presentes y en orden.
 *
 * @param sql - Consulta SQL
 * @param paramsObj - Objeto con valores de parámetros
 * @param orderKeys - Claves en el orden esperado por la query
 * @param opts - Opciones de validación
 * @returns {unknown[]} Array de valores en orden
 * @throws {Error} Si faltan parámetros o hay parámetros extra (en modo estricto)
 */
export function prepareNamedParams(
    sql: unknown,
    paramsObj: unknown,
    orderKeys: unknown,
    opts: NamedParamsOptions = {}
) {
    const options: Required<NamedParamsOptions> = {
        strict: true,
        enforceSqlArity: true,
        ...opts,
    }

    if (!isPlainObject(paramsObj)) {
        throw new Error('exeNamed params must be an object')
    }
    if (!Array.isArray(orderKeys) || orderKeys.length === 0) {
        throw new Error('exeNamed orderKeys must be a non-empty array')
    }

    const keys = orderKeys.map((k) => String(k))

    const missing = keys.filter((k) => !(k in paramsObj))
    if (missing.length > 0) {
        throw new Error(`Missing params: ${missing.join(', ')}`)
    }

    if (options.strict) {
        const allowed = new Set(keys)
        const extras = Object.keys(paramsObj).filter((k) => !allowed.has(k))
        if (extras.length > 0) {
            throw new Error(`Unexpected params: ${extras.join(', ')}`)
        }
    }

    const paramsArray = keys.map((k) => paramsObj[k])

    if (options.enforceSqlArity) {
        const expected = sqlMaxParamIndex(sql)
        if (expected !== paramsArray.length) {
            throw new Error(
                `Params/orderKeys length (${paramsArray.length}) does not match SQL placeholder count (${expected})`
            )
        }
    }

    return paramsArray
}

/**
 * Componente de acceso a base de datos (PostgreSQL).
 *
 * Encapsula la gestión de conexiones (Pool), ejecución de consultas
 * y manejo de errores. Soporta queries parametrizadas por posición.
 *
 * @example
 * ```typescript
 * const db = new DBComponent(deps)
 * const rows = await db.query('SELECT * FROM users WHERE id = $1', [1])
 * ```
 */
export default class DBComponent implements IDatabase {
    pool: Pool
    serverErrors: any
    private log: ILogger

    /**
     * Crea una instancia de DBComponent.
     *
     * @param deps - Dependencias (config, i18n, log)
     */
    constructor(deps: { config: IConfig; i18n: II18nService; log: ILogger }) {
        const { config, i18n, log } = deps
        this.pool = new Pool((config as any).db as any)
        this.serverErrors = i18n.get('errors.server')
        this.log = log
    }

    /**
     * Executes a query from the QueryService.
     * Preferred new method for accessing queries.
     */
    async query<T extends QueryResultRow = any>(
        queryDef: string | { sql: string },
        params?: any[]
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
     * Ejecuta una consulta SQL cruda directamente.
     *
     * @param sql - String SQL
     * @param params - Parámetros opcionales
     * @returns {Promise<QueryResult>} Resultado de la consulta
     */
    async exeRaw(sql: unknown, params?: unknown): Promise<QueryResult<any>> {
        let client: PoolClient | undefined
        try {
            if (typeof sql !== 'string' || sql.trim().length === 0) {
                throw new Error('exeRaw sql must be a non-empty string')
            }
            const paramsArray = buildParamsArray(params)

            client = await this.pool.connect()
            return await client.query(sql, paramsArray as any[])
        } catch (e: any) {
            const msg = `${this.serverErrors.dbError.msg}, DBComponent.exeRaw: ${e?.message || e}`
            this.log.show({ type: (this.log as any).TYPE_ERROR, msg })
            const err = new Error(this.serverErrors.dbError.msg) as Error & {
                code?: unknown
                cause?: unknown
            }
            err.code = this.serverErrors.dbError.code
            ;(err as any).cause = e
            throw err
        } finally {
            try {
                client?.release?.()
            } catch {}
        }
    }
}
