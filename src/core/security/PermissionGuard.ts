import { IDatabase, ILogger, IPermissionProvider } from '../../types/core.js'

/**
 * Consultas SQL usadas por el PermissionGuard.
 */
const PermissionQueries = {
    loadPermissions: `
        SELECT o.name as object_name, m.name as method_name, p.id as profile_id
        FROM security.permission_methods pm 
        INNER JOIN security.profiles p ON pm.profile_id = p.id 
        INNER JOIN security.methods m ON m.id = pm.method_id 
        INNER JOIN security.objects o ON o.id = m.object_id
    `,
}

/**
 * Guardián de permisos basado en base de datos.
 *
 * Implementa el patrón "Cache-Aside" cargando todos los permisos en memoria al inicio
 * para permitir verificaciones síncronas de alta velocidad durante las transacciones.
 *
 * @class PermissionGuard
 * @implements {IPermissionProvider}
 */
export class PermissionGuard implements IPermissionProvider {
    private db: IDatabase
    private log: ILogger
    // Usamos un Set de strings "profileId:objectName:methodName" para búsqueda O(1)
    private permissions: Set<string> = new Set()

    /**
     * Crea una instancia de PermissionGuard.
     *
     * @param db - Cliente de base de datos para cargar permisos
     * @param log - Servicio de logging
     */
    constructor(db: IDatabase, log: ILogger) {
        this.db = db
        this.log = log.child({ category: 'PermissionGuard' })
    }

    /**
     * Carga/Recarga la matriz de permisos desde la base de datos.
     * Construye un índice en memoria para verificaciones rápidas.
     *
     * @returns {Promise<void>} Promesa que resuelve al completar la carga
     * @throws {Error} Si falla la consulta a base de datos
     */
    async load(): Promise<void> {
        try {
            const res = await this.db.query(PermissionQueries.loadPermissions)
            this.permissions.clear()

            if (res && res.rows) {
                for (const row of res.rows) {
                    const key = this.buildKey(
                        Number(row.profile_id),
                        String(row.object_name),
                        String(row.method_name)
                    )
                    this.permissions.add(key)
                }
            }

            this.log.info(`PermissionGuard: Cargados ${this.permissions.size} permisos en memoria`)
        } catch (err: unknown) {
            const errorMsg = err instanceof Error ? err.message : String(err)
            this.log.error(`PermissionGuard: Fallo al cargar permisos: ${errorMsg}`)
            throw err
        }
    }

    /**
     * Verifica si un perfil tiene permiso de ejecución sobre un método específico.
     *
     * @param profileId - Identificador numérico del perfil de usuario
     * @param objectName - Nombre del Business Object (ej. 'Auth')
     * @param methodName - Nombre del método (ej. 'login')
     * @returns {boolean} true si el permiso existe, false en caso contrario
     */
    check(profileId: number, objectName: string, methodName: string): boolean {
        // Validación básica de inputs
        if (!objectName || !methodName || !Number.isInteger(profileId)) {
            return false
        }

        const key = this.buildKey(profileId, objectName, methodName)
        return this.permissions.has(key)
    }

    /**
     * Construye la clave única para el Set de permisos.
     * Formato: `profile_id:object_name:method_name`
     */
    private buildKey(profileId: number, objectName: string, methodName: string): string {
        return `${profileId}:${objectName}:${methodName}`
    }
}
