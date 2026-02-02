# Database Layer

The framework uses pure `pg` (node-postgres) with a robust abstraction layer (`DBComponent`).
We prioritize native SQL over ORMs for maximum control and performance.

## 1. Configuration & Pool

The system starts a single connection pool.

- **Shared Pool**: Avoids the costly TCP handshake per query.
- **Configuration (.env)**: `PGHOST`, `PGPORT`, `PGUSER`, `PGDATABASE`.
- **Fail Fast**: If credentials are wrong, the server refuses to start.

## 2. Execution Methods

### A. `db.query<T>(sql, params)` (Recommended)

Modern method with generic type support. Queries can be strings or `{ sql: string }` objects.

```typescript
import { UserQueries } from './User.Queries.js'
import { User } from './User.Types.js'

// With generic typing
const result = await this.db.query<User>(UserQueries.findById, [id])
const user = result.rows[0] // ← TypeScript knows this is User | undefined

// With inline SQL
const count = await this.db.query<{ count: number }>('SELECT count(*) FROM users', [])
```

### B. `exeRaw(sql, params)`

For quick or dynamic inline queries (no typing).

```typescript
const res = await db.exeRaw('SELECT count(*) FROM users')
```

---

## 3. Colocated Queries

Each BO has its own `{Name}Queries.ts` file with all SQL queries.

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

### Usage in Repository

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

## 4. Transactions (ACID)

To ensure data integrity:

```typescript
const client = await this.db.pool.connect()
try {
    await client.query('BEGIN')
    // ... multiple inserts / updates ...
    await client.query('COMMIT')
} catch (e) {
    await client.query('ROLLBACK')
    throw e // Re-throw for the logger to capture
} finally {
    client.release() // CRITICAL! Release the client to the pool.
}
```
