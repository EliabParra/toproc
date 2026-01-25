import { Context } from '../core/ctx.js'
import {
    templateBO,
    templateRepository,
    templateService,
    templateSchemas,
} from '../templates/bo.js'
import fs from 'node:fs/promises'
import path from 'node:path'

export class NewCommand {
    constructor(private ctx: Context) {}

    async run(objectName: string, options: any) {
        if (!objectName) throw new Error('Object Name is required')

        const methods = options.methods
            ? options.methods.split(',')
            : ['get', 'create', 'update', 'delete']

        const cleanName = objectName.replace(/BO$/, '')

        const boContent = templateBO(objectName, methods)
        const repoContent = templateRepository(cleanName)
        const serviceContent = templateService(cleanName)
        const schemasContent = templateSchemas(cleanName, methods)

        const dir = path.join(this.ctx.config.rootDir, 'BO', cleanName)
        await fs.mkdir(dir, { recursive: true })

        const files = [
            { path: path.join(dir, `${cleanName}BO.ts`), content: boContent },
            { path: path.join(dir, `${cleanName}Repository.ts`), content: repoContent },
            { path: path.join(dir, `${cleanName}Service.ts`), content: serviceContent },
            { path: path.join(dir, `schemas.ts`), content: schemasContent },
        ]

        if (this.ctx.config.isDryRun) {
            console.log(`[DRY] would create ${dir}`)
            for (const f of files) {
                console.log(`[DRY] Would write to ${f.path}`)
                // console.log(f.content) // Too verbose?
            }
        } else {
            for (const f of files) {
                await fs.writeFile(f.path, f.content)
                console.log(`Created ${f.path}`)
            }
        }
    }
}
