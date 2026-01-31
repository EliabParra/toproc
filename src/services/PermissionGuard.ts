import { IDatabase, ILogger } from '../types/core.js'

const PermissionQueries = {
    loadPermissions: `
        SELECT o.object_name as object_na, m.method_name as method_na, p.profile_id 
        FROM security.permission_methods pm 
        INNER JOIN security.profiles p ON pm.profile_id = p.profile_id 
        INNER JOIN security.methods m ON m.method_id = pm.method_id 
        INNER JOIN security.objects o ON o.object_id = m.object_id
    `,
}

export class PermissionGuard {
    private db: IDatabase
    private log: ILogger
    private permissions: Set<string> = new Set()

    constructor(db: IDatabase, log: ILogger) {
        this.db = db
        this.log = log
    }

    async load() {
        try {
            const res = await this.db.query(PermissionQueries.loadPermissions)
            this.permissions.clear()
            if (res && res.rows) {
                for (const row of res.rows) {
                    // Key format: profile_id:object_na:method_na
                    const key = `${row.profile_id}:${row.object_na}:${row.method_na}`
                    this.permissions.add(key)
                }
            }
            this.log.show({
                type: (this.log as any).TYPE_INFO,
                msg: `PermissionGuard loaded ${this.permissions.size} permissions.`,
            })
        } catch (err: any) {
            this.log.show({
                type: (this.log as any).TYPE_ERROR,
                msg: `PermissionGuard load failed: ${err.message}`,
            })
            throw err
        }
    }

    check(profileId: number, objectNa: string, methodNa: string): boolean {
        // Special case: Profile 1 (admin) usually bypasses, but keeping it strict to DB for now unless specified
        // If needed: if (profileId === 1) return true;

        const key = `${profileId}:${objectNa}:${methodNa}`
        return this.permissions.has(key)
    }
}
