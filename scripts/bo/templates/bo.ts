/**
 * Generadores de Plantillas de BO
 *
 * Funciones para generar archivos de Business Object desde plantillas.
 * Nomenclatura de archivos:
 * - {Nombre}BO.ts (archivo principal)
 * - {Nombre}Service.ts
 * - {Nombre}Repository.ts
 * - {Nombre}Schemas.ts
 * - {Nombre}Types.ts
 * - {Nombre}Messages.ts
 * - {Nombre}Errors.ts
 * - {Nombre}Module.ts
 */

export * from './types.js'
export * from './messages.js'
export * from './queries.js'

/**
 * Extrae métodos async públicos de un archivo BO
 *
 * @param fileContent - Contenido del archivo BO
 * @returns Lista de nombres de métodos encontrados
 */
export function parseMethodsFromBO(fileContent: string): string[] {
    const methods = new Set<string>()
    const re = /\basync\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(/g
    let m: RegExpExecArray | null
    while ((m = re.exec(fileContent)) != null) {
        const name = m[1]
        if (['constructor'].includes(name) || name.startsWith('_') || name.startsWith('#')) continue
        methods.add(name)
    }
    return Array.from(methods)
}

/**
 * Genera el contenido del archivo schemas (Schemas.ts)
 *
 * @param objectName - Nombre del objeto
 * @param methods - Lista de métodos a generar
 * @returns Contenido del archivo Schemas.ts
 */
export function templateSchemas(objectName: string, methods: string[]) {
    const cleanName = objectName.replace(/BO$/, '')
    const pascalName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1)
    const lowerName = cleanName.toLowerCase()

    const methodSchemas = methods
        .map((m) => {
            const lower = m.toLowerCase()
            const isStandardWithId =
                (lower === 'get' ||
                    lower.includes('update') ||
                    lower.includes('delete') ||
                    lower.includes('remove') ||
                    lower.includes('findbyid')) &&
                !lower.includes('getall')

            let content = `        // TODO: Definir validación. Usa messages.validation.xxx`

            if (isStandardWithId) {
                content = `        id: z.coerce.number(),`
            } else if (lower.includes('getall')) {
                content = `        // Parámetros de paginación o filtros opcionales`
            }

            return `    ${m}: z.object({
${content}
    }),`
        })
        .join('\n')

    return `import { z } from 'zod'
import { ${pascalName}Messages } from './${pascalName}Messages.js'

/**
 * Schemas Zod para métodos de ${pascalName}BO
 *
 * Los mensajes de validación se derivan del set de mensajes del BO.
 */
export type ${pascalName}MessagesSet = typeof ${pascalName}Messages.es

export const create${pascalName}Schemas = (messages: ${pascalName}MessagesSet = ${pascalName}Messages.es) => {
    const validation = messages.validation ?? ${pascalName}Messages.es.validation

    return {
${methodSchemas}
    }
}

export const ${pascalName}Schemas = create${pascalName}Schemas(${pascalName}Messages.es)

// Exporta schemas individuales para inferencia de tipos
${methods.map((m) => `export type ${m.charAt(0).toUpperCase() + m.slice(1)}Input = z.infer<typeof ${pascalName}Schemas.${m}>`).join('\n')}
`
}

/**
 * Genera el contenido del archivo Repository (Repository.ts)
 *
 * @param objectName - Nombre del objeto
 * @returns Contenido del archivo Repository.ts
 */
export function templateRepository(objectName: string) {
    const cleanName = objectName.replace(/BO$/, '')
    const pascalName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1)

    return `import { IDatabase } from '../../src/core/business-objects/index.js'
import { ${pascalName}Queries, Types } from './${pascalName}Module.js'

/**
 * Repositorio para operaciones de base de datos de ${pascalName}BO.
 *
 * Todas las consultas a la base de datos se encapsulan aquí.
 * Los nombres de queries deben coincidir con entradas en src/config/queries.json
 */
export class ${pascalName}Repository implements Types.I${pascalName}Repository {
    constructor(private readonly db: IDatabase) {}

    /**
     * Busca todos los ${pascalName.toLowerCase()}s
     */
    async findAll(): Promise<Types.${pascalName}Summary[]> {
        const result = await this.db.query<Types.${pascalName}Summary>(${pascalName}Queries.findAll, [])
        return result.rows
    }

    /**
     * Busca ${pascalName.toLowerCase()} por ID
     */
    async findById(id: number): Promise<Types.${pascalName} | null> {
        const result = await this.db.query<Types.${pascalName}>(${pascalName}Queries.findById, [id])
        return result.rows[0]
    }

    /**
     * Crea nuevo ${pascalName.toLowerCase()}
     */
    async create(data: Partial<Types.${pascalName}>): Promise<Types.${pascalName} | null> {
        const result = await this.db.query<Types.${pascalName}>(${pascalName}Queries.create, [
            // TODO: Mapear campos de data a parámetros del query
        ])
        return result.rows[0]
    }

    /**
     * Actualiza ${pascalName.toLowerCase()}
     */
    async update(id: number, data: Partial<Types.${pascalName}>): Promise<Types.${pascalName} | null> {
        const result = await this.db.query<Types.${pascalName}>(${pascalName}Queries.update, [
            id,
            // TODO: Mapear campos de data a parámetros del query
        ])
        return result.rows[0]
    }

    /**
     * Elimina ${pascalName.toLowerCase()}
     */
    async delete(id: number): Promise<boolean> {
        const result = await this.db.query<Types.RowCount${pascalName}>(${pascalName}Queries.delete, [id])
        return result.rowCount !== null && result.rowCount > 0
    }

    /**
     * Verifica si ${pascalName.toLowerCase()} existe
     */
    async exists(id: number): Promise<boolean> {
        const result = await this.db.query<Types.Exists${pascalName}>(${pascalName}Queries.exists, [id])
        return result.rows[0].exists
    }
}
`
}

/**
 * Genera el contenido del archivo Service (Service.ts)
 *
 * @param objectName - Nombre del objeto
 * @returns Contenido del archivo Service.ts
 */
export function templateService(objectName: string) {
    const cleanName = objectName.replace(/BO$/, '')
    const pascalName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1)

    return `import { BOService, IConfig, IDatabase } from '../../src/core/business-objects/index.js'
import type { ILogger } from '../../src/types/core.js'
import { ${pascalName}Repository, Errors, Types } from './${pascalName}Module.js'

/**
 * Capa de servicio para lógica de negocio de ${pascalName}.
 *
 * Contiene lógica de negocio pura, libre de concerns HTTP.
 * Lanza errores específicos del dominio desde ./${pascalName}Errors.js
 */
export class ${pascalName}Service extends BOService implements Types.I${pascalName}Service {
    constructor(
        private readonly repo: ${pascalName}Repository,
        log: ILogger,
        config: IConfig,
        db: IDatabase
    ) {
        super(log, config, db)
    }

    /**
     * Obtiene todos los ${pascalName.toLowerCase()}s
     */
    async getAll(): Promise<Types.${pascalName}Summary[]> {
        return this.repo.findAll()
    }

    /**
     * Obtiene ${pascalName.toLowerCase()} por ID
     * @throws ${pascalName}NotFoundError si no se encuentra
     */
    async getById(id: number): Promise<Types.${pascalName}> {
        const entity = await this.repo.findById(id)
        if (!entity) {
            throw new Errors.${pascalName}NotFoundError(id)
        }
        return entity
    }

    /**
     * Crea nuevo ${pascalName.toLowerCase()}
     */
    async create(data: Partial<Types.${pascalName}>): Promise<Types.${pascalName} | null> {
        this.log.info('Creando ${pascalName.toLowerCase()}')
        return this.repo.create(data)
    }

    /**
     * Actualiza ${pascalName.toLowerCase()}
     * @throws ${pascalName}NotFoundError si no se encuentra
     */
    async update(id: number, data: Partial<Types.${pascalName}>): Promise<Types.${pascalName}> {
        const updated = await this.repo.update(id, data)
        if (!updated) {
            throw new Errors.${pascalName}NotFoundError(id)
        }
        return updated
    }

    /**
     * Elimina ${pascalName.toLowerCase()}
     * @throws ${pascalName}NotFoundError si no se encuentra
     */
    async delete(id: number): Promise<void> {
        const deleted = await this.repo.delete(id)
        if (!deleted) {
            throw new Errors.${pascalName}NotFoundError(id)
        }
        this.log.info('Eliminado ${pascalName.toLowerCase()} ' + id)
    }
}
`
}

/**
 * Genera el contenido del archivo Module (Module.ts)
 *
 * @param objectName - Nombre del objeto
 * @returns Contenido del archivo Module.ts
 */
export function templateModule(objectName: string) {
    const cleanName = objectName.replace(/BO$/, '')
    const pascalName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1)

    return `export { ${pascalName}Service } from './${pascalName}Service.js'
export { ${pascalName}Repository } from './${pascalName}Repository.js'
export { ${pascalName}Messages } from './${pascalName}Messages.js'
export { ${pascalName}Schemas, create${pascalName}Schemas } from './${pascalName}Schemas.js'
export { ${pascalName}Queries } from './${pascalName}Queries.js'
export type * as Schemas from './${pascalName}Schemas.js'
export type * as Types from './${pascalName}Types.js'
export * as Errors from './${pascalName}Errors.js'
export * as Queries from './${pascalName}Queries.js'
`
}

/**
 * Genera el contenido del archivo BO principal ({Nombre}BO.ts)
 *
 * @param className - Nombre de la clase (ej: "Product" o "ProductBO")
 * @param methods - Lista de métodos a generar
 * @returns Contenido del archivo BO.ts
 */
export function templateBO(className: string, methods: string[]) {
    const cleanName = className.replace(/BO$/, '')
    const pascalName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1)
    const lowerName = cleanName.toLowerCase()
    const boClassName = `${pascalName}BO`

    const methodStubs = methods
        .map((m) => {
            const isCreate =
                m.toLowerCase().includes('create') || m.toLowerCase().includes('register')
            const isDelete =
                m.toLowerCase().includes('delete') || m.toLowerCase().includes('remove')
            const isGet = m.toLowerCase().includes('get') || m.toLowerCase().includes('find')

            const methodPascal = m.charAt(0).toUpperCase() + m.slice(1)
            const inputType = `Schemas.${methodPascal}Input`

            // Infer return type and service call
            let returnType = 'any'
            let serviceCall = `await this.service.${m}(data)`

            if (m.toLowerCase().includes('getall')) {
                returnType = `Array<Types.${pascalName}Summary>`
            } else if (isGet || isCreate || m.toLowerCase().includes('update')) {
                returnType = `Types.${pascalName}`
            } else if (isDelete) {
                returnType = 'void'
            }

            // Intelligent defaults for service calls
            if (isGet && m === 'get') {
                serviceCall = `await this.service.getById(data.id)`
            } else if (m.toLowerCase().includes('update')) {
                serviceCall = `await this.service.update(data.id, data)`
            } else if (isDelete) {
                serviceCall = `await this.service.delete(data.id)`
            } else if (m.toLowerCase().includes('getall')) {
                serviceCall = `await this.service.getAll()`
            }

            return `    /**
     * Operación ${methodPascal}
     *
     * @param params - Parámetros de la solicitud
     * @returns ApiResponse con el resultado
     */
    async ${m}(params: ${inputType}): Promise<ApiResponse> {
        return this.exec<${inputType}, ${returnType}>(
            params,
            this.${lowerName}Schemas.${m},
            async (data) => {
                const result: ${returnType} = ${serviceCall}

                return this.${isCreate ? 'created' : 'success'}(${isDelete ? 'null' : 'result'}, this.${lowerName}Messages.${m})
            }
        )
    }`
        })
        .join('\n\n')

    return `import { BaseBO, BODependencies, ApiResponse } from '../../src/core/business-objects/index.js'
import { ${pascalName}Repository, ${pascalName}Service, ${pascalName}Messages, create${pascalName}Schemas, Schemas } from './${pascalName}Module.js'
import type { Types } from './${pascalName}Module.js'

/**
 * Business Object para el dominio ${pascalName}.
 *
 * Orquesta transacciones de ${pascalName} y expone endpoints de API.
 */
export class ${boClassName} extends BaseBO {
    private service: ${pascalName}Service

    constructor(deps: BODependencies) {
        super(deps)
        const repo = new ${pascalName}Repository(this.db)
        this.service = new ${pascalName}Service(repo, this.log, this.config, this.db)
    }

    /**
     * Helpers para mensajes tipados
     */
    private get ${lowerName}Messages() {
        return this.i18n.use(${pascalName}Messages)
    }

    private get ${lowerName}Schemas() {
        return create${pascalName}Schemas(this.${lowerName}Messages)
    }

${methodStubs}
}
`
}
