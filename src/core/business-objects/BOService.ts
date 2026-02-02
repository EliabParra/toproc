import { IDatabase, ILogger, IConfig } from '../../types/core.js'

/**
 * Clase base para Servicios de Lógica de Negocio (BOServices).
 *
 * Provee acceso tipado a las dependencias core: DB, Log, Config.
 * Evita la repetición de constructores en cada servicio.
 */
export abstract class BOService {
    protected readonly db: IDatabase
    protected readonly log: ILogger
    protected readonly config: IConfig

    constructor(log: ILogger, config: IConfig, db: IDatabase) {
        // Auto-categorization: "AuthService" -> "Auth"
        const category = this.constructor.name.replace('Service', '')
        this.log = log.child({ category })

        this.config = config
        this.db = db
    }

    /**
     * Helper para obtener un único resultado o null de una consulta
     */
    protected oneOrNull<T>(rows: T[]): T | null {
        return rows.length > 0 ? rows[0] : null
    }

    /**
     * Helper para mapear resultados si es necesario
     */
    protected mapRows<T, U>(rows: T[], mapper: (row: T) => U): U[] {
        return rows.map(mapper)
    }
}
