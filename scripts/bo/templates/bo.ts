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

export function templateSchemas(objectName: string, methods: string[]) {
    const methodSchemas = methods
        .map((m) => {
            return `    ${m}: z.object({
        // TODO: define validation
    }),`
        })
        .join('\n')

    return `import { z } from 'zod'

export const ${objectName}Schemas = {
${methodSchemas}
}
`
}

export function templateRepository(objectName: string) {
    return `import { IDatabase } from '../../src/types/core.js'

/**
 * Repositorio de acceso a datos para ${objectName}BO.
 *
 * Encapsula la lógica de consultas a base de datos.
 */
export class ${objectName}Repository {
    /**
     * @param db - Instancia de base de datos
     */
    constructor(private readonly db: IDatabase) {}

    // Example
    async findAll() {
        return this.db.exe('public', 'TODO_findAll', [])
    }
}
`
}

export function templateService(objectName: string) {
    return `import { ILogger, IConfig } from '../../src/types/core.js'
import { ${objectName}Repository } from './${objectName}Repository.js'

/**
 * Servicio de Negocio para ${objectName}.
 *
 * Contiene la lógica pura de negocio, libre de dependencias HTTP.
 */
export class ${objectName}Service {
    constructor(
        private readonly repo: ${objectName}Repository,
        private readonly log: ILogger,
        private readonly config: IConfig
    ) {}

    // TODO: Implement business logic
}
`
}

export function templateBO(className: string, methods: string[]) {
    // Remove "BO" suffix if present for clean class name usage in some places, but usually className already includes BO or not?
    // Usually input is "User", className is "UserBO" or just "User"?
    // In new.ts: `const boContent = templateBO(objectName, methods)`
    // And file is `${objectName}BO.ts`.
    // So if I pass "User", class name should be "UserBO"?
    // The previous template used `export class ${className} extends BusinessObject`.
    // If user passed "User", it exported class "User".
    // But file was UserBO.ts.
    // I should probably suffix it if strictly following convention, but let's stick to input.
    // Wait, typical convention is `UserBO` class in `UserBO.ts`.
    // I will append BO if missing.
    const cleanName = className.replace(/BO$/, '')
    const boClassName = `${cleanName}BO`

    const methodStubs = methods
        .map((m) => {
            const isCreate =
                m.toLowerCase().includes('create') || m.toLowerCase().includes('register')
            return `    /**
     * Método ${m}
     *
     * @param params - Parámetros de la transacción
     * @returns ApiResponse estandarizada
     */
    async ${m}(params: unknown): Promise<ApiResponse> {
        try {
            const vRes = this.validate<z.infer<typeof ${cleanName}Schemas.${m}>>(
                params,
                ${cleanName}Schemas.${m}
            )
            if (!vRes.ok) return this.validationError(vRes.alerts)

            // const { ...args } = vRes.data
            // const result = await this.service.${m}(vRes.data)
            
            return this.${isCreate ? 'created' : 'success'}(null, '${className} ${m} OK')
        } catch (err) {
            this.log.show({ type: this.log.TYPE_ERROR, msg: \`${boClassName}.${m}: \${err}\` })
            return this.error('Unknown Error')
        }
    }`
        })
        .join('\n\n')

    return `import { BaseBO, BODependencies } from '../../src/core/base/BaseBO.js'
import { ApiResponse } from '../../src/core/response/ApiResponse.js'
import { ${cleanName}Repository } from './${cleanName}Repository.js'
import { ${cleanName}Service } from './${cleanName}Service.js'
import { ${cleanName}Schemas } from './schemas.js'
import { z } from 'zod'

/**
 * Business Object para ${cleanName}.
 *
 * Orquesta transacciones del dominio ${cleanName}.
 */
export class ${boClassName} extends BaseBO {
    private service: ${cleanName}Service

    constructor(deps?: BODependencies) {
        super(deps ?? {
            db: (globalThis as any).db,
            log: (globalThis as any).log,
            config: (globalThis as any).config,
            v: (globalThis as any).validator, // Using AppValidator
        })
        const repo = new ${cleanName}Repository(this.db)
        this.service = new ${cleanName}Service(repo, this.log, this.config)
    }

${methodStubs}
}
`
}
