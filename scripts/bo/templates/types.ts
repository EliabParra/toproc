/**
 * Genera el contenido del archivo Types (.Types.ts)
 *
 * @param objectName - Nombre del objeto (ej: "ProductBO" o "Product")
 * @param methods - Lista de métodos opcional
 * @returns Contenido del archivo .Types.ts
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

// ============================================================
// Tipos de Entidad
// ============================================================

export interface ${pascalName} {
    // TODO: Definir propiedades de la entidad
    id: number
    createdAt: Date
    updatedAt?: Date
}

export interface ${pascalName}Summary {
    // TODO: Definir propiedades para listados/resúmenes
    id: number
}

// ============================================================
// Tipos de Entrada
// ============================================================

export interface Create${pascalName}Input {
    // TODO: Definir datos para creación
}

export interface Update${pascalName}Input {
    // TODO: Definir datos para actualización
}

export interface Get${pascalName}Input {
    // TODO: Definir datos para get
}

export interface GetAll${pascalName}Input {
    // TODO: Definir datos para getAll
}

export interface Delete${pascalName}Input {
    // TODO: Definir datos para delete
}

${extraInputs}

export type RowCount${pascalName} = {
    rowCount: number
}

export type Exists${pascalName} = {
    exists: boolean
}
`
}
