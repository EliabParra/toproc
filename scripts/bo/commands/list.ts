import { Context } from '../core/ctx.js'

export class ListCommand {
    constructor(private ctx: Context) {}

    async run() {
        this.ctx.log.show({ type: this.ctx.log.TYPE_INFO, msg: 'Listing BOs...' })
        await this.ctx.ensureGlobals()

        const res = await this.ctx.db.exeRaw(
            `SELECT object_id, object_name FROM security.objects ORDER BY object_name`
        )
        const objects = res.rows || []

        console.log(`\n📦 Registered Objects: ${objects.length}`)
        for (const obj of objects) {
            console.log(`- ${obj.object_name} (ID: ${obj.object_id})`)
        }
    }
}
