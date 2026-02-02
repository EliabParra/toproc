/**
 * Genera el contenido del archivo de locales (AuthMessages.ts)
 *
 * @param objectName - Nombre del objeto
 * @param methods - Lista de métodos a generar
 * @returns TS object definition string
 */
export function templateLocales(objectName: string, methods: string[]) {
    const cleanName = objectName.replace(/BO$/, '')
    const pascalName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1)

    // Generar claves de mensaje predeterminadas para cada método (ES)
    const methodMessagesEs: Record<string, string> = {}
    methods.forEach((m) => {
        let msg = 'Operación exitosa'
        if (m.includes('create') || m.includes('register')) msg = 'Creado exitosamente'
        if (m.includes('update')) msg = 'Actualizado exitosamente'
        if (m.includes('delete') || m.includes('remove')) msg = 'Eliminado exitosamente'
        if (m.includes('get') || m.includes('find') || m.includes('list'))
            msg = 'Obtenido exitosamente'
        methodMessagesEs[m] = msg
    })

    // Generar claves de mensaje predeterminadas para cada método (EN)
    const methodMessagesEn: Record<string, string> = {}
    methods.forEach((m) => {
        let msg = 'Operation successful'
        if (m.includes('create') || m.includes('register')) msg = 'Created successfully'
        if (m.includes('update')) msg = 'Updated successfully'
        if (m.includes('delete') || m.includes('remove')) msg = 'Deleted successfully'
        if (m.includes('get') || m.includes('find') || m.includes('list'))
            msg = 'Retrieved successfully'
        methodMessagesEn[m] = msg
    })

    return `export const ${pascalName}Messages = {
    es: {
        // Success
        ${methods.map((m) => `${m}: '${methodMessagesEs[m]}',`).join('\n        ')}

        // Common errors
        notFound: '${pascalName} no encontrado',
        alreadyExists: 'Ya existe un registro con estos datos',
        invalidData: 'Datos inválidos',
        cannotDelete: 'No se puede eliminar el registro',
        permissionDenied: 'Permiso denegado',

        // Validation
        validation: {
            requiredField: 'Campo requerido',
            invalidFormat: 'Formato inválido',
        },
    },
    en: {
        // Success
        ${methods.map((m) => `${m}: '${methodMessagesEn[m]}',`).join('\n        ')}

        // Common errors
        notFound: '${pascalName} not found',
        alreadyExists: 'Record already exists',
        invalidData: 'Invalid data',
        cannotDelete: 'Cannot delete record',
        permissionDenied: 'Permission denied',

        // Validation
        validation: {
            requiredField: 'Field required',
            invalidFormat: 'Invalid format',
        },
    }
}`
}
