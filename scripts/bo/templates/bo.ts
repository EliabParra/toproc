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

export function templateBO(className: string, methods: string[]) {
    const methodStubs = methods
        .map(
            (m) => `
    async ${m}(params: any): Promise<ApiResponse> {
        try {
            // TODO: verify permissions if needed, or inputs.
            return this.success({ data: { message: '${m} implemented' } })
        } catch (e: any) {
            this.log.error(e)
            return this.serverError(e)
        }
    }`
        )
        .join('\n')

    return `import { ApiResponse } from '../../src/core/response/ApiResponse.js'
import { BusinessObject } from '../../src/core/bo/BusinessObject.js'

export class ${className} extends BusinessObject {
    constructor() {
        super()
    }

    // Los métodos auxiliares (helpers) que no se exponen como API
    // pueden iniciar con "_" (guion bajo).
    // En sync se ignoran y no se registran en DB.
    // Ejemplo: async _helper() { ... }

${methodStubs}
}
`
}
