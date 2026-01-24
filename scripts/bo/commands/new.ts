import { Context } from '../core/ctx.js'
import { templateBO } from '../templates/bo.js'
import fs from 'node:fs/promises'
import path from 'node:path'

export class NewCommand {
    constructor(private ctx: Context) {}

    async run(objectName: string, options: any) {
        if (!objectName) throw new Error('Object Name is required')

        const methods = options.methods
            ? options.methods.split(',')
            : ['get', 'create', 'update', 'delete']
        const boContent = templateBO(objectName, methods)

        const dir = path.join(this.ctx.config.rootDir, 'BO', objectName)
        await fs.mkdir(dir, { recursive: true })

        const filePath = path.join(dir, `${objectName}BO.ts`)

        if (this.ctx.config.isDryRun) {
            console.log(`[DRY] Would write to ${filePath}`)
            console.log(boContent)
        } else {
            await fs.writeFile(filePath, boContent)
            console.log(`Created ${filePath}`)
        }
    }
}
