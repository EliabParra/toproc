/**
 * Generadores de Plantillas de BO
 *
 * Funciones para generar archivos de Business Object desde plantillas.
 * Nomenclatura de archivos:
 * - {Nombre}BO.ts (archivo principal)
 * - {Nombre}.Service.ts
 * - {Nombre}.Repository.ts
 * - {Nombre}.Schemas.ts
 * - {Nombre}.Types.ts
 * - {Nombre}.Messages.ts
 * - {Nombre}.Errors.ts
 */

export * from './types.js'
export * from './messages.js'

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
 * Genera el contenido del archivo schemas (.Schemas.ts)
 *
 * @param objectName - Nombre del objeto
 * @param methods - Lista de métodos a generar
 * @returns Contenido del archivo .Schemas.ts
 */
export function templateSchemas(objectName: string, methods: string[]) {
    const cleanName = objectName.replace(/BO$/, '')
    const pascalName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1)

    const methodSchemas = methods
        .map((m) => {
            return `    ${m}: z.object({
        // TODO: Definir validación usando ${pascalName}Messages.VALIDATION
    }),`
        })
        .join('\n')

    return `import { z } from 'zod'
import { ${pascalName}Messages } from './${pascalName}.Messages.js'

/**
 * Schemas Zod para métodos de ${pascalName}BO
 * 
 * Usa ${pascalName}Messages.VALIDATION para mensajes de error consistentes.
 */
export const ${pascalName}Schemas = {
${methodSchemas}
}

// Exporta schemas individuales para inferencia de tipos
${methods.map((m) => `export type ${m.charAt(0).toUpperCase() + m.slice(1)}Input = z.infer<typeof ${pascalName}Schemas.${m}>`).join('\n')}
`
}

/**
 * Genera el contenido del archivo Repository (.Repository.ts)
 *
 * @param objectName - Nombre del objeto
 * @returns Contenido del archivo .Repository.ts
 */
export function templateRepository(objectName: string) {
    const cleanName = objectName.replace(/BO$/, '')
    const pascalName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1)

    return `import { IDatabase } from '../../src/types/core.js'
import type { ${pascalName}, ${pascalName}Summary } from './${pascalName}.Types.js'

/**
 * Repositorio para operaciones de base de datos de ${pascalName}BO.
 * 
 * Todas las consultas a la base de datos se encapsulan aquí.
 * Los nombres de queries deben coincidir con entradas en src/config/queries.json
 */
export class ${pascalName}Repository {
    constructor(private readonly db: IDatabase) {}

    /**
     * Busca todos los ${pascalName.toLowerCase()}s
     */
    async findAll(): Promise<${pascalName}Summary[]> {
        const result = await this.db.exe('public', '${pascalName.toLowerCase()}_findAll', [])
        return (result.rows ?? []) as ${pascalName}Summary[]
    }

    /**
     * Busca ${pascalName.toLowerCase()} por ID
     */
    async findById(id: number): Promise<${pascalName} | null> {
        const result = await this.db.exe('public', '${pascalName.toLowerCase()}_findById', [id])
        return (result.rows?.[0] ?? null) as ${pascalName} | null
    }

    /**
     * Crea nuevo ${pascalName.toLowerCase()}
     */
    async create(data: Partial<${pascalName}>): Promise<${pascalName}> {
        const result = await this.db.exe('public', '${pascalName.toLowerCase()}_create', [
            // TODO: Mapear campos de data a parámetros del query
        ])
        return result.rows?.[0] as ${pascalName}
    }

    /**
     * Actualiza ${pascalName.toLowerCase()}
     */
    async update(id: number, data: Partial<${pascalName}>): Promise<${pascalName} | null> {
        const result = await this.db.exe('public', '${pascalName.toLowerCase()}_update', [
            id,
            // TODO: Mapear campos de data a parámetros del query
        ])
        return (result.rows?.[0] ?? null) as ${pascalName} | null
    }

    /**
     * Elimina ${pascalName.toLowerCase()}
     */
    async delete(id: number): Promise<boolean> {
        const result = await this.db.exe('public', '${pascalName.toLowerCase()}_delete', [id])
        return (result.rowCount ?? 0) > 0
    }

    /**
     * Verifica si ${pascalName.toLowerCase()} existe
     */
    async exists(id: number): Promise<boolean> {
        const result = await this.db.exe('public', '${pascalName.toLowerCase()}_exists', [id])
        return result.rows?.[0]?.exists === true
    }
}
`
}

/**
 * Genera el contenido del archivo Service (.Service.ts)
 *
 * @param objectName - Nombre del objeto
 * @returns Contenido del archivo .Service.ts
 */
export function templateService(objectName: string) {
    const cleanName = objectName.replace(/BO$/, '')
    const pascalName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1)

    return `import { BOService } from '../../src/core/business-objects/BOService.js'
import { ILogger, IConfig, IDatabase } from '../../src/types/core.js'
import { ${pascalName}Repository } from './${pascalName}.Repository.js'
import type { ${pascalName}, ${pascalName}Summary } from './${pascalName}.Types.js'
import { ${pascalName}NotFoundError } from './${pascalName}.Errors.js'

/**
 * Capa de servicio para lógica de negocio de ${pascalName}.
 * 
 * Contiene lógica de negocio pura, libre de concerns HTTP.
 * Lanza errores específicos del dominio desde ./${pascalName}.Errors.js
 */
export class ${pascalName}Service extends BOService {
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
    async getAll(): Promise<${pascalName}Summary[]> {
        return this.repo.findAll()
    }

    /**
     * Obtiene ${pascalName.toLowerCase()} por ID
     * @throws ${pascalName}NotFoundError si no se encuentra
     */
    async getById(id: number): Promise<${pascalName}> {
        const entity = await this.repo.findById(id)
        if (!entity) {
            throw new ${pascalName}NotFoundError(id)
        }
        return entity
    }

    /**
     * Crea nuevo ${pascalName.toLowerCase()}
     */
    async create(data: Partial<${pascalName}>): Promise<${pascalName}> {
        this.log.show({ type: this.log.TYPE_INFO, msg: \`Creando ${pascalName.toLowerCase()}\` })
        return this.repo.create(data)
    }

    /**
     * Actualiza ${pascalName.toLowerCase()}
     * @throws ${pascalName}NotFoundError si no se encuentra
     */
    async update(id: number, data: Partial<${pascalName}>): Promise<${pascalName}> {
        const updated = await this.repo.update(id, data)
        if (!updated) {
            throw new ${pascalName}NotFoundError(id)
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
            throw new ${pascalName}NotFoundError(id)
        }
        this.log.show({ type: this.log.TYPE_INFO, msg: \`Eliminado ${pascalName.toLowerCase()} \${id}\` })
    }
}
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
    const boClassName = `${pascalName}BO`

    const methodStubs = methods
        .map((m) => {
            const isCreate =
                m.toLowerCase().includes('create') || m.toLowerCase().includes('register')
            const methodPascal = m.charAt(0).toUpperCase() + m.slice(1)

            return `    /**
     * Operación ${methodPascal}
     * 
     * @param params - Parámetros de la solicitud
     * @returns ApiResponse con el resultado
     */
    async ${m}(params: unknown): Promise<ApiResponse> {
        return this.exec<z.infer<typeof ${pascalName}Schemas.${m}>, any>(
            params,
            ${pascalName}Schemas.${m},
            async (data) => {
                // TODO: Implementar lógica de negocio
                // const result = await this.service.${m}(data)
                
                return this.${isCreate ? 'created' : 'success'}(null, ${pascalName}Messages.${m.toUpperCase()})
            }
        )
    }`
        })
        .join('\n\n')

    return `import { BaseBO, BODependencies } from '../../src/core/base/BaseBO.js'
import { ApiResponse } from '../../src/core/response/ApiResponse.js'
import { ${pascalName}Repository } from './${pascalName}.Repository.js'
import { ${pascalName}Service } from './${pascalName}.Service.js'
import { ${pascalName}Schemas } from './${pascalName}.Schemas.js'
import { ${pascalName}Messages } from './${pascalName}.Messages.js'
import { is${pascalName}Error, handle${pascalName}Error } from './${pascalName}.Errors.js'
import { z } from 'zod'

/**
 * Business Object para el dominio ${pascalName}.
 * 
 * Orquesta transacciones de ${pascalName} y expone endpoints de API.
 * Usa:
 * - ./${pascalName}.Schemas.ts para validación de entrada
 * - ./${pascalName}.Messages.ts para strings visibles al usuario
 * - ./${pascalName}.Errors.ts para manejo de errores del dominio
 * - ./${pascalName}.Types.ts para interfaces TypeScript
 */
export class ${boClassName} extends BaseBO {
    private service: ${pascalName}Service

    constructor(deps?: BODependencies) {
        super(deps ?? {
            db: (globalThis as any).db,
            log: (globalThis as any).log,
            config: (globalThis as any).config,
            v: (globalThis as any).validator,
        })
        const repo = new ${pascalName}Repository(this.db)
        this.service = new ${pascalName}Service(repo, this.log, this.config, this.db)
    }

${methodStubs}
}
`
}
