# Capa de Base de Datos (Database Layer)

El framework utiliza `pg` (node-postgres) puro, sobre una capa de abstracción robusta (`DBComponent`).
Priorizamos SQL nativo sobre ORMs para máximo control y performance.

## 1. Configuración y Pool

El sistema arranca un pool de conexiones único.

- **Pool Compartido**: Evita el costoso handshake TCP por query.
- **Configuración (.env)**: `PGHOST`, `PGPORT`, `PGUSER`, `PGDATABASE`.
- **Fail Fast**: Si las credenciales están mal, el servidor se niega a arrancar.

## 2. Métodos de Ejecución

### A. `db.query<T>(sql, params)` (Recomendado)

Método moderno con soporte de tipos genéricos. Las queries pueden ser strings o objetos `{ sql: string }`.

```typescript
import { UserQueries } from './User.Queries.js'
import { User } from './User.Types.js'

// Con tipado genérico
const result = await this.db.query<User>(UserQueries.findById, [id])
const user = result.rows[0] // ← TypeScript sabe que es User | undefined

// Con SQL inline
const count = await this.db.query<{ count: number }>('SELECT count(*) FROM users', [])
```

### B. `exeRaw(sql, params)`

Para queries rápidas o dinámicas in-line (sin tipado).

```typescript
const res = await db.exeRaw('SELECT count(*) FROM users')
```

---

## 3. Queries Colocalizadas

Cada BO tiene su archivo `{Nombre}Queries.ts` con todas las queries SQL.

```typescript
// UserQueries.ts
export const UserQueries = {
    findAll: `SELECT * FROM users ORDER BY created_at DESC`,

    findById: `SELECT * FROM users WHERE user_id = $1`,

    create: `
        INSERT INTO users (name, email, password_hash)
        VALUES ($1, $2, $3)
        RETURNING *
    `,

    delete: `DELETE FROM users WHERE user_id = $1`,
} as const

export type UserQueryKey = keyof typeof UserQueries
```

### Uso en Repository

```typescript
import { UserQueries } from './User.Queries.js'
import { User, UserSummary } from './User.Types.js'

export class UserRepository {
    constructor(private db: IDatabase) {}

    async findAll(): Promise<UserSummary[]> {
        const result = await this.db.query<UserSummary>(UserQueries.findAll, [])
        return result.rows
    }

    async findById(id: number): Promise<User | null> {
        const result = await this.db.query<User>(UserQueries.findById, [id])
        return result.rows[0] ?? null
    }
}
```

---

## 4. Transacciones (ACID)

Para garantizar integridad de datos:

```typescript
const client = await this.db.pool.connect()
try {
    await client.query('BEGIN')
    // ... múltiples inserts / updates ...
    await client.query('COMMIT')
} catch (e) {
    await client.query('ROLLBACK')
    throw e // Relanza para que el logger lo capture
} finally {
    client.release() // ¡CRÍTICO! Liberar el cliente al pool.
}
```
