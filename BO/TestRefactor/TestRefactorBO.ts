import { ApiResponse } from '../../src/core/response/ApiResponse.js'
import { BusinessObject } from '../../src/core/bo/BusinessObject.js'

export class TestRefactor extends BusinessObject {
    constructor() {
        super()
    }

    // Los métodos auxiliares (helpers) que no se exponen como API
    // pueden iniciar con "_" (guion bajo).
    // En sync se ignoran y no se registran en DB.
    // Ejemplo: async _helper() { ... }

    async get(params: any): Promise<ApiResponse> {
        try {
            // TODO: verify permissions if needed, or inputs.
            return this.success({ data: { message: 'get implemented' } })
        } catch (e: any) {
            this.log.error(e)
            return this.serverError(e)
        }
    }

    async create(params: any): Promise<ApiResponse> {
        try {
            // TODO: verify permissions if needed, or inputs.
            return this.success({ data: { message: 'create implemented' } })
        } catch (e: any) {
            this.log.error(e)
            return this.serverError(e)
        }
    }
}
