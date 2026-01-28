/**
 * Genera el contenido del archivo Messages (.Messages.ts)
 *
 * @param objectName - Nombre del objeto
 * @param methods - Lista de métodos a generar
 * @returns Contenido del archivo .Messages.ts
 */
export function templateMessages(objectName: string, methods: string[]) {
    const cleanName = objectName.replace(/BO$/, '')
    const pascalName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1)

    // Generar claves de mensaje predeterminadas para cada método
    const methodMessages = methods
        .map((m) => {
            const upper = m.toUpperCase()
            // Provide intelligent defaults for common method names
            let msg = 'Operación exitosa'
            if (m.includes('create') || m.includes('register')) msg = 'Creado exitosamente'
            if (m.includes('update')) msg = 'Actualizado exitosamente'
            if (m.includes('delete') || m.includes('remove')) msg = 'Eliminado exitosamente'
            if (m.includes('get') || m.includes('find') || m.includes('list'))
                msg = 'Obtenido exitosamente'

            return `    ${upper}: '${msg}',`
        })
        .join('\n')

    return `/**
 * Mensajes y strings para ${pascalName}
 */

export const ${pascalName}Messages = {
    // Éxito
${methodMessages}

    // Error
    NOT_FOUND: '${pascalName} no encontrado',

    // Validación
    VALIDATION: {
        // TODO: Agregar mensajes de validación
        REQUIRED_FIELD: 'Campo requerido',
    },
}

export type ${pascalName}MessageKey = keyof typeof ${pascalName}Messages
export type ${pascalName}ValidationKey = keyof typeof ${pascalName}Messages.VALIDATION
`
}
