import { IDatabase, ILogger } from '../types/core.js'

const PermissionQueries = {
    loadPermissions: `
        SELECT o.name as object_name, m.name as method_name, p.id as profile_id
        FROM security.permission_methods pm 
        INNER JOIN security.profiles p ON pm.profile_id = p.id 
        INNER JOIN security.methods m ON m.id = pm.method_id 
        INNER JOIN security.objects o ON o.id = m.object_id
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
                    // Key format: profile_id:objectName:methodName
                    const key = `${row.profile_id}:${row.object_name}:${row.method_name}`
                    this.permissions.add(key)
                }
            }
            this.log.show({
                type: this.log.TYPE_INFO,
                msg: `PermissionGuard loaded ${this.permissions.size} permissions.`,
            })
        } catch (err: any) {
            this.log.show({
                type: this.log.TYPE_ERROR,
                msg: `PermissionGuard load failed: ${err.message}`,
            })
            throw err
        }
    }

    check(profileId: number, objectName: string, methodName: string): boolean {
        // Special case: Profile 1 (admin) usually bypasses, but keeping it strict to DB for now unless specified
        // If needed: if (profileId === 1) return true;

        const key = `${profileId}:${objectName}:${methodName}`
        return this.permissions.has(key)
    }
}
