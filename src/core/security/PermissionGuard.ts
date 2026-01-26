import { IDatabase, ILogger } from '../../types/core.js'

/**
 * Guardián de permisos que verifica autorización de acceso.
 *
 * Mantiene un caché en memoria de la tabla `security.permission_methods`.
 * Verifica si un `profile_id` tiene acceso a un par `(object_na, method_na)`.
 *
 *
 * @example
 * ```typescript
 * const guard = new PermissionGuard(db, log)
 * await guard.load()
 *
 * const canAccess = guard.check(1, 'User', 'create') // true/false
 * ```
 */
export class PermissionGuard {
    private permissionCache: Map<string, boolean> = new Map()

    /**
     * Crea una instancia de PermissionGuard.
     *
     * @param db - Acceso a base de datos para cargar permisos
     * @param log - Logger para diagnósticos
     */
    constructor(
        private db: IDatabase,
        private log: ILogger
    ) {}

    private generateKey(profileId: number, method: string, object: string): string {
        return `${profileId}_${method}_${object}`
    }

    /**
     * Carga la tabla de permisos desde la base de datos.
     * Ejecuta `security.loadPermissions` y puebla el caché en memoria.
     *
     * @returns {Promise<void>}
     * @throws {Error} Si hay un error de conexión o consulta
     */
    async load(): Promise<void> {
        try {
            // Expected query: security.loadPermissions
            const result = await this.db.exe('security', 'loadPermissions', null)

            if (!result || !result.rows) {
                this.log.show({
                    type: this.log.TYPE_ERROR,
                    msg: 'PermissionGuard: loadPermissions returned no rows structure',
                })
                return
            }

            this.permissionCache.clear()

            for (const row of result.rows) {
                const key = this.generateKey(row.profile_id, row.method_na, row.object_na)
                this.permissionCache.set(key, true)
            }

            this.log.show({
                type: this.log.TYPE_INFO,
                msg: `PermissionGuard: Carga exitosa de ${this.permissionCache.size} permisos`,
            })
        } catch (err: any) {
            this.log.show({
                type: this.log.TYPE_ERROR,
                msg: `PermissionGuard.load error: ${err.message || err}`,
            })
            throw err
        }
    }

    /**
     * Verifica si un perfil tiene permiso para ejecutar un método en un objeto.
     *
     * @param profileId - ID del perfil del usuario
     * @param object - Nombre del Business Object
     * @param method - Nombre del método
     * @returns {boolean} True si tiene permiso explícito, False en caso contrario
     */
    check(profileId: number, object: string, method: string): boolean {
        const key = this.generateKey(profileId, method, object)
        return this.permissionCache.has(key)
    }

    /**
     * Agrega manualmente un permiso al caché (útil para testing o overrides).
     *
     * @param profileId - ID del perfil
     * @param object - Nombre del Business Object
     * @param method - Nombre del método
     */
    addPermission(profileId: number, object: string, method: string) {
        const key = this.generateKey(profileId, method, object)
        this.permissionCache.set(key, true)
    }
}
