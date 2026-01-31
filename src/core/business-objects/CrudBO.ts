import { BaseBO, BODependencies } from './BaseBO.js'

/**
 * Clase base para Business Objects que manejan operaciones CRUD estándar.
 * Reduce el boilerplate necesario para entidades simples.
 *
 * @template T - Tipo de la entidad completa
 * @template TCreate - Tipo del input para creación
 * @template TUpdate - Tipo del input para actualización
 */
export abstract class CrudBO<T, TCreate = T, TUpdate = Partial<T>> extends BaseBO {
    protected abstract readonly tableName: string
    protected abstract readonly idColumn: string

    constructor(deps: Partial<BODependencies>) {
        super(deps)
    }

    /**
     * Obtiene una entidad por su ID.
     */
    async get(id: number | string): Promise<ApiResponse<T>> {
        return this.exec<number | string, T>(
            id,
            null, // No validamos el ID simple aquí, asumimos que viene limpio o validar en ruta
            async (cleanId) => {
                const res = await this.db.exeRaw(
                    `SELECT * FROM ${this.tableName} WHERE ${this.idColumn} = $1`,
                    [cleanId]
                )
                if (res.rows.length === 0) return this.error('No encontrado', 404)
                return this.success(res.rows[0])
            }
        )
    }

    /**
     * Lista entidades con paginación simple (opcional).
     */
    async list(limit = 20, offset = 0): Promise<ApiResponse<T[]>> {
        // Podríamos usar exec aquí también, pero list suele requerir validación de query params
        try {
            const res = await this.db.exeRaw(`SELECT * FROM ${this.tableName} LIMIT $1 OFFSET $2`, [
                limit,
                offset,
            ])
            return this.success(res.rows)
        } catch (e) {
            return this.safeCatch(e) as any
        }
    }

    /**
     * Elimina una entidad por su ID.
     */
    async delete(id: number | string): Promise<ApiResponse<void>> {
        return this.exec<number | string, void>(id, null, async (cleanId) => {
            await this.db.exeRaw(`DELETE FROM ${this.tableName} WHERE ${this.idColumn} = $1`, [
                cleanId,
            ])
            return this.success(undefined, 'Eliminado')
        })
    }
}
