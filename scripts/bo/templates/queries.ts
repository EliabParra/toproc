/**
 * Genera el contenido del archivo Queries.ts para un Business Object
 *
 * @param objectName - Nombre del objeto (ej: "Product")
 * @returns Contenido del archivo Queries.ts generado
 */
export function templateQueries(objectName: string) {
    const cleanName = objectName.replace(/BO$/, '')
    const pascalName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1)
    const lowerName = cleanName.toLowerCase()

    return `export const ${pascalName}Queries = {
    findAll: {
        sql: 'SELECT * FROM ${lowerName}'
    },
    findById: {
        sql: 'SELECT * FROM ${lowerName} WHERE id = $1'
    },
    create: {
        sql: 'INSERT INTO ${lowerName} (created_at) VALUES (NOW()) RETURNING *' 
    },
    update: {
        sql: 'UPDATE ${lowerName} SET updated_at = NOW() WHERE id = $1 RETURNING *'
    },
    delete: {
        sql: 'DELETE FROM ${lowerName} WHERE id = $1'
    },
    exists: {
        sql: 'SELECT EXISTS(SELECT 1 FROM ${lowerName} WHERE id = $1)'
    }
} as const

export type ${pascalName}QueryKey = keyof typeof ${pascalName}Queries
`
}
