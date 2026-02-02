/**
 * Opciones para la preparación de parámetros nombrados.
 */
export type NamedParamsOptions = {
    /** Si es true, lanza error si hay parámetros extra en el objeto */
    strict?: boolean
    /** Si es true, verifica que la cantidad de parámetros coincida con los placeholders $N */
    enforceSqlArity?: boolean
}

/**
 * Calcula el índice máximo de parámetro ($N) en una consulta SQL.
 * Útil para validaciones de aridad.
 *
 * @param sql - Consulta SQL como string
 * @returns {number} El índice más alto encontrado (e.g. 3 para $3), o 0 si no hay.
 */
export function sqlMaxParamIndex(sql: unknown): number {
    if (typeof sql !== 'string') return 0
    let max = 0
    const re = /\$(\d+)/g
    let m: RegExpExecArray | null
    // Iterar sobre todas las coincidencias globales
    while ((m = re.exec(sql)) != null) {
        const n = Number(m[1])
        if (Number.isInteger(n) && n > max) max = n
    }
    return max
}

/**
 * Verifica si un valor es un objeto plano (no null, no array).
 */
function isPlainObject(val: unknown): val is Record<string, unknown> {
    return val !== null && typeof val === 'object' && !Array.isArray(val)
}

/**
 * Convierte diferentes formatos de entrada de parámetros a un array plano compatible con pg.
 *
 * @param params - Parámetros (puede ser array, objeto plano, o valor simple)
 * @returns {unknown[]} Array de parámetros normalizado
 */
export function buildParamsArray(params: unknown): unknown[] {
    if (params == null) return []
    const paramsArray: unknown[] = []

    if (Array.isArray(params)) {
        paramsArray.push(...params)
    } else if (isPlainObject(params)) {
        // Si es objeto, extraemos valores en orden de claves (no determinista para queries posicionales,
        // pero útil para conversiones genéricas). Para named params usar prepareNamedParams.
        for (const attr in params) {
            paramsArray.push(params[attr])
        }
    } else {
        paramsArray.push(params)
    }

    return paramsArray
}

/**
 * Prepara parámetros nombrados para una consulta SQL posicional.
 * Mapea un objeto de valores a un array ordenado según `orderKeys`.
 * Valida presencia de claves requeridas y opcionalmente claves extra.
 *
 * @param sql - Consulta SQL (para validación de aridad)
 * @param paramsObj - Objeto con valores de los parámetros
 * @param orderKeys - Lista de claves en el orden que la query espera ($1, $2, etc.)
 * @param opts - Opciones de validación
 * @returns {unknown[]} Array de valores ordenados listo para pg
 * @throws {Error} Si faltan parámetros o hay inconsistencias
 */
export function prepareNamedParams(
    sql: unknown,
    paramsObj: unknown,
    orderKeys: unknown,
    opts: NamedParamsOptions = {}
): unknown[] {
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

    // Validar claves faltantes
    const missing = keys.filter((k) => !(k in paramsObj))
    if (missing.length > 0) {
        throw new Error(`Missing params: ${missing.join(', ')}`)
    }

    // Validar claves extra si es estricto
    if (options.strict) {
        const allowed = new Set(keys)
        const extras = Object.keys(paramsObj).filter((k) => !allowed.has(k))
        if (extras.length > 0) {
            throw new Error(`Unexpected params: ${extras.join(', ')}`)
        }
    }

    // Construir array ordenado
    const paramsArray = keys.map((k) => paramsObj[k])

    // Validar aridad SQL vs Params
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
