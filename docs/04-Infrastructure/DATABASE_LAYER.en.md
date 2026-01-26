# Database Layer

The framework uses pure `pg` (node-postgres), over a robust abstraction layer (`DBComponent`).
We prioritize native SQL over ORMs for maximum control and performance.

## 1. Configuration and Pool

System starts a single connection pool.

- **Shared Pool**: Avoids costly TCP handshake per query.
- **Configuration (.env)**: `PGHOST`, `PGPORT`, `PGUSER`, `PGDATABASE`.
- **Fail Fast**: If credentials are wrong, server refuses to start.

## 2. Execution Methods

### A. `exeRaw(sql, params)`

For fast or dynamic in-line queries.

```typescript
const res = await db.exeRaw('SELECT count(*) FROM users')
```

### B. `exe(schema, query, params)` (Parameter Store)

Classic method. Queries live in separate `.ts` files.

```typescript
// src/db/queries/auth.ts -> export const getUser = "SELECT..."
await db.exe('auth', 'getUser', [email])
```

### C. `exeNamed` (The Crown Jewel)

Solves positional parameter problem (`$1, $2... $20`).
Allows object binding with key validation.

**SQL**:

```sql
INSERT INTO users (name, email) VALUES ($1, $2)
```

**Code**:

```typescript
// Validates object has 'name' and 'email', and puts them in correct order.
await db.exeNamed('users', 'create', formData, ['name', 'email'])
```

---

## 3. Transactions (ACID)

To ensure data integrity:

```typescript
const client = await this.db.pool.connect()
try {
    await client.query('BEGIN')
    // ... multiple inserts / updates ...
    await client.query('COMMIT')
} catch (e) {
    await client.query('ROLLBACK')
    throw e // Rethrow so logger captures it
} finally {
    client.release() // CRITICAL! Release client to pool.
}
```
