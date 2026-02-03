import { Context } from '../core/ctx.js'
import {
    templateBO,
    templateRepository,
    templateService,
    templateSchemas,
    templateQueries,
    templateModule,
} from '../templates/bo.js'

import { templateTypes } from '../templates/types.js'
import { templateLocales } from '../templates/messages.js'
import { templateErrors } from '../templates/errors.js'
import { Interactor } from '../interactor/ui.js'
import fs from 'node:fs/promises'
import path from 'node:path'
import 'colors'

interface NewCommandOptions {
    methods?: string
    skipTypes?: boolean
    skipMessages?: boolean
    skipErrors?: boolean
}

type Preset = 'Default (CRUD)' | 'ReadOnly' | 'Minimal' | 'Custom'

/**
 * Comando para crear nuevos Business Objects
 *
 * Genera la estructura de 9 archivos con la nomenclatura:
 * - {Nombre}BO.ts (archivo principal)
 * - {Nombre}Service.ts
 * - {Nombre}Repository.ts
 * - {Nombre}Schemas.ts
 * - {Nombre}Types.ts
 * - {Nombre}Messages.ts
 * - {Nombre}Errors.ts
 * - {Nombre}Queries.ts
 * - {Nombre}Module.ts
 */
export class NewCommand {
    private ui: Interactor

    constructor(private ctx: Context) {
        this.ui = new Interactor()
    }

    async run(objectName: string, options: NewCommandOptions = {}) {
        try {
            let finalName = objectName
            let methods = options.methods
                ? options.methods.split(',').map((m) => m.trim())
                : ['get', 'getAll', 'create', 'update', 'delete']
            let skipTypes = options.skipTypes
            let skipMessages = options.skipMessages
            let skipErrors = options.skipErrors

            // Interactive Mode
            if (!objectName) {
                this.ui.header()
                finalName = await this.ui.ask('Business Object Name (e.g. Product)')
                if (!finalName) {
                    this.ui.error('Name is required')
                    return
                }

                const preset = (await this.ui.select('Select a Preset', [
                    'Default (CRUD)',
                    'ReadOnly',
                    'Minimal',
                    'Custom',
                ])) as Preset

                if (preset === 'Default (CRUD)') {
                    methods = ['get', 'getAll', 'create', 'update', 'delete']
                } else if (preset === 'ReadOnly') {
                    methods = ['get', 'getAll']
                } else if (preset === 'Minimal') {
                    methods = ['get']
                    skipTypes = true
                    skipMessages = true
                    skipErrors = true
                } else if (preset === 'Custom') {
                    methods = await this.ui.multiSelect(
                        'Select Methods',
                        ['get', 'getAll', 'create', 'update', 'delete'],
                        ['get', 'getAll', 'create', 'update', 'delete']
                    )
                    // Custom file selection could be added here, currently defaulting to all
                }
            }

            if (!finalName) throw new Error('Object Name is required')

            const cleanName = finalName.replace(/BO$/, '')
            const pascalName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1)

            if (!this.ctx.config.isDryRun) {
                console.log('')
                this.ui.info(` Creating Business Object: ${pascalName.bold}`)
                this.ui.startSpinner(' Generating templates...')
            }

            // Generate contents
            const boContent = templateBO(finalName, methods)
            const repoContent = templateRepository(cleanName)
            const serviceContent = templateService(cleanName)
            const schemasContent = templateSchemas(cleanName, methods)
            const typesContent = templateTypes(cleanName, methods)
            const localesContent = templateLocales(cleanName, methods)
            const errorsContent = templateErrors(cleanName, methods)
            const queriesContent = templateQueries(cleanName)
            const moduleContent = templateModule(cleanName)

            const dir = path.join(this.ctx.config.rootDir, 'BO', pascalName)
            const localesDir = path.join(dir, 'locales')

            const files = [
                {
                    path: path.join(dir, `${pascalName}BO.ts`),
                    content: boContent,
                    name: `${pascalName}BO.ts`,
                    icon: '📦',
                    desc: 'Main Entry Point',
                },
                {
                    path: path.join(dir, `${pascalName}Service.ts`),
                    content: serviceContent,
                    name: `${pascalName}Service.ts`,
                    icon: '🧠',
                    desc: 'Business Logic',
                },
                {
                    path: path.join(dir, `${pascalName}Repository.ts`),
                    content: repoContent,
                    name: `${pascalName}Repository.ts`,
                    icon: '🛢️',
                    desc: 'Data Access',
                },
                {
                    path: path.join(dir, `${pascalName}Queries.ts`),
                    content: queriesContent,
                    name: `${pascalName}Queries.ts`,
                    icon: '🔍',
                    desc: 'SQL Queries',
                },
                {
                    path: path.join(dir, `${pascalName}Schemas.ts`),
                    content: schemasContent,
                    name: `${pascalName}Schemas.ts`,
                    icon: '📜',
                    desc: 'Validation',
                },
                {
                    path: path.join(dir, `${pascalName}Module.ts`),
                    content: moduleContent,
                    name: `${pascalName}Module.ts`,
                    icon: '🧩',
                    desc: 'Module Barrel',
                },
            ]

            if (!skipTypes) {
                files.push({
                    path: path.join(dir, `${pascalName}Types.ts`),
                    content: typesContent,
                    name: `${pascalName}Types.ts`,
                    icon: '📘',
                    desc: 'TypeScript Interfaces',
                })
            }
            if (!skipMessages) {
                files.push({
                    path: path.join(dir, `${pascalName}Messages.ts`),
                    content: localesContent,
                    name: `${pascalName}Messages.ts`,
                    icon: '💬',
                    desc: 'Messages for i18n',
                })
            }
            if (!skipErrors) {
                files.push({
                    path: path.join(dir, `${pascalName}Errors.ts`),
                    content: errorsContent,
                    name: `${pascalName}Errors.ts`,
                    icon: '🛑',
                    desc: 'Domain Errors',
                })
            }

            if (this.ctx.config.isDryRun) {
                console.log('')
                console.log(`${'📁'.yellow} ${dir}/`.yellow)
                this.ui.table(
                    ['File', 'Description'],
                    files.map((f) => [`${f.icon} ${f.name}`, f.desc])
                )
                console.log('')
                this.ui.info('Dry run complete. No files written.'.gray)
            } else {
                // Check if directory exists
                try {
                    await fs.access(dir)
                    this.ui.stopSpinner(false)
                    throw new Error(`Directory already exists: ${dir}`)
                } catch (e: any) {
                    if (e.code !== 'ENOENT') {
                        this.ui.stopSpinner(false)
                        throw e
                    }
                }

                await fs.mkdir(dir, { recursive: true })

                // Simulate a slight delay for the spinner to be visible
                await new Promise((r) => setTimeout(r, 500))

                for (const f of files) {
                    await fs.writeFile(f.path, f.content)
                }

                this.ui.stopSpinner(true)

                console.log('')
                this.ui.success(`${pascalName} created successfully!`)

                this.ui.table(
                    ['File', 'Status'],
                    files.map((f) => [`${f.icon} ${f.name}`, 'Created'.green])
                )

                console.log('')
                console.log('💡 Next steps:'.cyan)
                console.log(`   1. Edit ${`${pascalName}Types.ts`.bold}`)
                console.log(`   2. Edit ${`${pascalName}Schemas.ts`.bold}`)
                console.log(`   3. Configure DB queries in ${`${pascalName}Repository.ts`.bold}`)
                console.log(`   4. Run: ${'pnpm run bo sync'.bold}`)
                console.log('')
            }
        } finally {
            this.ui.close()
        }
    }
}
