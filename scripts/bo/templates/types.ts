/**
 * Genera el contenido del archivo Types (Types.ts)
 *
 * @param objectName - Nombre del objeto (ej: "ProductBO" o "Product")
 * @param methods - Lista de métodos opcional
 * @returns Contenido del archivo Types.ts
 */
export function templateTypes(objectName: string, methods: string[] = []) {
    const cleanName = objectName.replace(/BO$/, '')
    const pascalName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1)

    const extraInputs = methods
        .filter((m) => !['create', 'update', 'delete', 'get', 'getall'].includes(m.toLowerCase()))
        .map((m) => {
            const pascalMethod = m.charAt(0).toUpperCase() + m.slice(1)
            return `export interface ${pascalMethod}${pascalName}Input {
    // TODO: Definir datos para ${m}
}`
        })
        .join('\n\n')

    return `/**
 * Definiciones de tipos para ${pascalName}
 */

export namespace ${pascalName} {
    // ============================================================
    // Tipos de Entidad
    // ============================================================

    export interface Entity {
        // TODO: Definir propiedades de la entidad
        id: number
        createdAt: Date
        updatedAt?: Date
    }

    export interface Summary {
        // TODO: Definir propiedades para listados/resúmenes
        id: number
    }

    // ============================================================
    // Tipos de Entrada
    // ============================================================

    export interface CreateInput {
        // TODO: Definir datos para creación
    }

    export interface UpdateInput {
        // TODO: Definir datos para actualización
    }

    export interface GetInput {
        // TODO: Definir datos para get
    }

    export interface GetAllInput {
        // TODO: Definir datos para getAll
    }

    export interface DeleteInput {
        // TODO: Definir datos para delete
    }

${extraInputs
    .split('\n')
    .map((line) => (line ? '    ' + line : line))
    .join('\n')}

    export type RowCount = {
        rowCount: number
    }

    export type Exists = {
        exists: boolean
    }

    // ============================================================
    // Contratos (Service/Repository)
    // ============================================================

    export interface Repository {
        findAll(): Promise<Summary[]>
        findById(id: number): Promise<Entity | null>
        create(data: Partial<Entity>): Promise<Entity | null>
        update(id: number, data: Partial<Entity>): Promise<Entity | null>
        delete(id: number): Promise<boolean>
        exists(id: number): Promise<boolean>
    }

    export interface Service {
        getAll(): Promise<Summary[]>
        getById(id: number): Promise<Entity>
        create(data: Partial<Entity>): Promise<Entity | null>
        update(id: number, data: Partial<Entity>): Promise<Entity>
        delete(id: number): Promise<void>
    }
}

export type ${pascalName} = ${pascalName}.Entity
export type ${pascalName}Summary = ${pascalName}.Summary
export type Create${pascalName}Input = ${pascalName}.CreateInput
export type Update${pascalName}Input = ${pascalName}.UpdateInput
export type Get${pascalName}Input = ${pascalName}.GetInput
export type GetAll${pascalName}Input = ${pascalName}.GetAllInput
export type Delete${pascalName}Input = ${pascalName}.DeleteInput
${extraInputs
    .split('\n\n')
    .filter(Boolean)
    .map((block) => {
        const name = block.match(/interface\s+(\w+)/)?.[1]
        return name ? `export type ${name} = ${pascalName}.${name}` : ''
    })
    .filter(Boolean)
    .join('\n')}
export type RowCount${pascalName} = ${pascalName}.RowCount
export type Exists${pascalName} = ${pascalName}.Exists
export type I${pascalName}Repository = ${pascalName}.Repository
export type I${pascalName}Service = ${pascalName}.Service
`
}
