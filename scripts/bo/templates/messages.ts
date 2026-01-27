/**
 * Generador de plantillas para archivos messages.ts de BO
 * Contiene todos los strings y mensajes visibles al usuario
 */

/**
 * Genera el contenido del archivo messages.ts para un Business Object
 *
 * @param objectName - Nombre del objeto (ej: "Product")
 * @param methods - Lista de métodos del BO
 * @returns Contenido del archivo messages.ts generado
 */
export function templateMessages(objectName: string, methods: string[]) {
    const cleanName = objectName.replace(/BO$/, '')
    const pascalName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1)
    const lowerName = cleanName.toLowerCase()

    // Nombre para mostrar en español
    const displayName = pascalName

    // Genera mensajes de éxito basados en métodos
    const successEntries = methods
        .map((method) => {
            const upper = method.toUpperCase()

            if (
                method.toLowerCase().includes('create') ||
                method.toLowerCase().includes('register')
            ) {
                return `    ${upper}: '${displayName} creado exitosamente',`
            }
            if (method.toLowerCase().includes('update')) {
                return `    ${upper}: '${displayName} actualizado exitosamente',`
            }
            if (
                method.toLowerCase().includes('delete') ||
                method.toLowerCase().includes('remove')
            ) {
                return `    ${upper}: '${displayName} eliminado exitosamente',`
            }
            if (method.toLowerCase().includes('get') || method.toLowerCase().includes('find')) {
                return `    ${upper}: '${displayName} encontrado',`
            }
            if (method.toLowerCase().includes('list') || method.toLowerCase().includes('search')) {
                return `    ${upper}: 'Búsqueda completada',`
            }
            return `    ${upper}: 'Operación ${method} completada',`
        })
        .join('\n')

    return `/**
 * Mensajes y strings para ${pascalName} Business Object
 * 
 * Centraliza todo el texto visible al usuario aquí para:
 * - Fácil soporte de internacionalización (i18n)
 * - Mensajería consistente
 * - Única fuente de verdad
 */

export const ${pascalName}Messages = {
    // ============================================================
    // Mensajes de Éxito
    // ============================================================
${successEntries}

    // ============================================================
    // Mensajes de Error
    // ============================================================
    NOT_FOUND: '${displayName} no encontrado',
    ALREADY_EXISTS: 'Ya existe un ${lowerName} con esos datos',
    INVALID_DATA: 'Datos de ${lowerName} inválidos',
    CANNOT_DELETE: 'No se puede eliminar este ${lowerName}',
    PERMISSION_DENIED: 'No tienes permiso para esta acción',

    // ============================================================
    // Mensajes de Validación (para schemas Zod)
    // ============================================================
    VALIDATION: {
        ID_REQUIRED: 'El ID es requerido',
        ID_POSITIVE: 'El ID debe ser un número positivo',
        NAME_REQUIRED: 'El nombre es requerido',
        NAME_TOO_SHORT: 'El nombre debe tener al menos 2 caracteres',
        NAME_TOO_LONG: 'El nombre no puede exceder 100 caracteres',
        // Agregar más mensajes de validación según sea necesario
    },

    // ============================================================
    // Mensajes Dinámicos (funciones)
    // ============================================================
    
    /** Mensaje con conteo */
    foundCount: (count: number) => 
        \`Se encontraron \${count} \${count === 1 ? '${lowerName}' : '${lowerName}s'}\`,
    
    /** No encontrado específico */
    notFoundById: (id: number) => 
        \`${displayName} con ID \${id} no encontrado\`,
    
    /** Detección de duplicado */
    duplicateField: (field: string, value: string) => 
        \`Ya existe un ${lowerName} con \${field}: "\${value}"\`,
}

// ============================================================
// Exportación de tipos para claves de mensajes con tipado seguro
// ============================================================

export type ${pascalName}MessageKey = keyof typeof ${pascalName}Messages
export type ${pascalName}ValidationKey = keyof typeof ${pascalName}Messages.VALIDATION
`
}
