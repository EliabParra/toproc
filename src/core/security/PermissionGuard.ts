import { IDatabase, ILogger } from '../../types/core.js'

export class PermissionGuard {
    private permissionCache: Map<string, boolean> = new Map()

    constructor(
        private db: IDatabase,
        private log: ILogger
    ) {}

    private generateKey(profileId: number, method: string, object: string): string {
        return `${profileId}_${method}_${object}`
    }

    /**
     * Loads permissions from the database.
     * Corresponds to legacy SecurityService.loadPermissions
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
                msg: `PermissionGuard: Loaded ${this.permissionCache.size} permissions`,
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
     * Checks if a profile has permission to execute a method on an object.
     */
    check(profileId: number, object: string, method: string): boolean {
        const key = this.generateKey(profileId, method, object)
        return this.permissionCache.has(key)
    }

    /**
     * Manually add a permission (useful for testing or super-admin overrides)
     */
    addPermission(profileId: number, object: string, method: string) {
        const key = this.generateKey(profileId, method, object)
        this.permissionCache.set(key, true)
    }
}
