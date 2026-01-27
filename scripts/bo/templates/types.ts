/**
 * Generadores de plantillas para archivos de tipos de BO
 * Contiene interfaces TypeScript para el dominio del BO
 */

/**
 * Genera el contenido del archivo types.ts para un Business Object
 *
 * @param objectName - Nombre del objeto (ej: "Product")
 * @param methods - Lista de métodos del BO
 * @returns Contenido del archivo types.ts generado
 */
export function templateTypes(objectName: string, methods: string[]) {
    const cleanName = objectName.replace(/BO$/, '')
    const pascalName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1)

    // Genera tipos de entrada basados en nombres de métodos
    const inputTypes = methods
        .map((method) => {
            const methodPascal = method.charAt(0).toUpperCase() + method.slice(1)

            if (
                method.toLowerCase().includes('create') ||
                method.toLowerCase().includes('register')
            ) {
                return `export interface ${methodPascal}${pascalName}Input {
    // TODO: Definir campos de creación
    // name: string
    // email: string
}`
            }

            if (method.toLowerCase().includes('update')) {
                return `export interface ${methodPascal}${pascalName}Input {
    ${objectName.toLowerCase()}Id: number
    // TODO: Definir campos de actualización (todos opcionales excepto ID)
    // name?: string
}`
            }

            if (
                method.toLowerCase().includes('delete') ||
                method.toLowerCase().includes('remove')
            ) {
                return `export interface ${methodPascal}${pascalName}Input {
    ${objectName.toLowerCase()}Id: number
}`
            }

            if (method.toLowerCase().includes('get') || method.toLowerCase().includes('find')) {
                return `export interface ${methodPascal}${pascalName}Input {
    ${objectName.toLowerCase()}Id: number
}`
            }

            if (method.toLowerCase().includes('list') || method.toLowerCase().includes('search')) {
                return `export interface ${methodPascal}${pascalName}Input {
    // TODO: Definir parámetros de búsqueda/filtro
    search?: string
    page?: number
    limit?: number
}`
            }

            // Fallback genérico
            return `export interface ${methodPascal}${pascalName}Input {
    // TODO: Definir campos de entrada
}`
        })
        .join('\n\n')

    return `/**
 * Definiciones de tipos para ${pascalName} Business Object
 * 
 * Este archivo contiene todas las interfaces TypeScript usadas por ${pascalName}BO.
 * Mantén los tipos aquí para tener una única fuente de verdad.
 */

// ============================================================
// Tipos de Entidad
// ============================================================

/**
 * Entidad principal ${pascalName} como se almacena en base de datos
 */
export interface ${pascalName} {
    ${objectName.toLowerCase()}Id: number
    // TODO: Definir campos de la entidad
    // name: string
    // description?: string
    createdAt: Date
    updatedAt?: Date
}

/**
 * Entidad ${pascalName} para vistas de lista/resumen (versión ligera)
 */
export interface ${pascalName}Summary {
    ${objectName.toLowerCase()}Id: number
    // TODO: Definir campos del resumen
    // name: string
}

// ============================================================
// Tipos de Entrada (Parámetros de Métodos)
// ============================================================

${inputTypes}

// ============================================================
// Tipos de Filtros
// ============================================================

export interface ${pascalName}Filters {
    search?: string
    // TODO: Agregar filtros específicos del dominio
    // status?: string
    // fromDate?: Date
    // toDate?: Date
}

// ============================================================
// Paginación
// ============================================================

export interface ${pascalName}ListResult {
    items: ${pascalName}Summary[]
    total: number
    page: number
    limit: number
    hasMore: boolean
}
`
}
