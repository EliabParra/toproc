import { Context } from '../core/ctx.js'
import {
    templateBO,
    templateRepository,
    templateService,
    templateSchemas,
} from '../templates/bo.js'
import { templateTypes } from '../templates/types.js'
import { templateMessages } from '../templates/messages.js'
import { templateErrors } from '../templates/errors.js'
import fs from 'node:fs/promises'
import path from 'node:path'
import 'colors'

interface NewCommandOptions {
    methods?: string
    skipTypes?: boolean
    skipMessages?: boolean
    skipErrors?: boolean
}

/**
 * Comando para crear nuevos Business Objects
 *
 * Genera la estructura de 7 archivos con la nomenclatura:
 * - {Nombre}BO.ts (archivo principal)
 * - {Nombre}.Service.ts
 * - {Nombre}.Repository.ts
 * - {Nombre}.Schemas.ts
 * - {Nombre}.Types.ts
 * - {Nombre}.Messages.ts
 * - {Nombre}.Errors.ts
 */
export class NewCommand {
    constructor(private ctx: Context) {}

    async run(objectName: string, options: NewCommandOptions = {}) {
        if (!objectName) throw new Error('Object Name is required')

        const methods = options.methods
            ? options.methods.split(',').map((m) => m.trim())
            : ['get', 'create', 'update', 'delete']

        const cleanName = objectName.replace(/BO$/, '')
        const pascalName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1)

        console.log('')
        console.log(`✨ Creating Business Object: ${pascalName}`.cyan.bold)
        console.log('══════════════════════════════════════════════════'.gray)
        console.log('')

        // Generate all template contents
        const boContent = templateBO(objectName, methods)
        const repoContent = templateRepository(cleanName)
        const serviceContent = templateService(cleanName)
        const schemasContent = templateSchemas(cleanName, methods)
        const typesContent = templateTypes(cleanName, methods)
        const messagesContent = templateMessages(cleanName, methods)
        const errorsContent = templateErrors(cleanName, methods)

        const dir = path.join(this.ctx.config.rootDir, 'BO', pascalName)

        // Build file list (7 files by default) with new naming convention
        const files = [
            {
                path: path.join(dir, `${pascalName}BO.ts`),
                content: boContent,
                name: `${pascalName}BO.ts`,
                icon: '📦',
            },
            {
                path: path.join(dir, `${pascalName}.Service.ts`),
                content: serviceContent,
                name: `${pascalName}.Service.ts`,
                icon: '🧠',
            },
            {
                path: path.join(dir, `${pascalName}.Repository.ts`),
                content: repoContent,
                name: `${pascalName}.Repository.ts`,
                icon: '🗄️',
            },
            {
                path: path.join(dir, `${pascalName}.Schemas.ts`),
                content: schemasContent,
                name: `${pascalName}.Schemas.ts`,
                icon: '✅',
            },
        ]

        // Add optional files (on by default)
        if (!options.skipTypes) {
            files.push({
                path: path.join(dir, `${pascalName}.Types.ts`),
                content: typesContent,
                name: `${pascalName}.Types.ts`,
                icon: '📘',
            })
        }
        if (!options.skipMessages) {
            files.push({
                path: path.join(dir, `${pascalName}.Messages.ts`),
                content: messagesContent,
                name: `${pascalName}.Messages.ts`,
                icon: '💬',
            })
        }
        if (!options.skipErrors) {
            files.push({
                path: path.join(dir, `${pascalName}.Errors.ts`),
                content: errorsContent,
                name: `${pascalName}.Errors.ts`,
                icon: '❌',
            })
        }

        if (this.ctx.config.isDryRun) {
            console.log(`${'📁'.yellow} ${dir}/`.yellow)
            for (const f of files) {
                console.log(`   ├── ${f.icon} ${f.name} ${'[DRY RUN]'.gray}`)
            }
            console.log('')
            console.log(`${'ℹ'.blue}  Dry run complete. No files written.`.gray)
        } else {
            // Check if directory exists
            try {
                await fs.access(dir)
                throw new Error(`Directory already exists: ${dir}`)
            } catch (e: any) {
                if (e.code !== 'ENOENT') throw e
            }

            await fs.mkdir(dir, { recursive: true })
            console.log(`${'📁'.green} ${pascalName}/`)

            for (const f of files) {
                await fs.writeFile(f.path, f.content)
                console.log(`   ├── ${f.icon} ${f.name} .............. ${'✅'.green}`)
            }

            console.log('')
            console.log(
                `${'🎉'.green} ${pascalName} BO created with ${files.length} files!`.green.bold
            )
            console.log('')
            console.log('💡 Next steps:'.cyan)
            console.log(
                `   1. Edit ${`${pascalName}.Types.ts`.bold} to define your data structures`
            )
            console.log(`   2. Edit ${`${pascalName}.Schemas.ts`.bold} to add Zod validations`)
            console.log(`   3. Run: ${'npm run bo sync '.bold}${pascalName} to register methods`)
            console.log(`   4. Assign permissions: ${'npm run bo perms '.bold}${pascalName}`)
            console.log('')
        }
    }
}
