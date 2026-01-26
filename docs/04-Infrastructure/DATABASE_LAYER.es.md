# Capa de Base de Datos (Database Layer)

El framework utiliza `pg` (node-postgres) puro, sobre una capa de abstracción robusta (`DBComponent`).
Priorizamos SQL nativo sobre ORMs para máximo control y performance.

## 1. Configuración y Pool

El sistema arranca un pool de conexiones único.

- **Pool Compartido**: Evita el costoso handshake TCP por query.
- **Configuración (.env)**: `PGHOST`, `PGPORT`, `PGUSER`, `PGDATABASE`.
- **Fail Fast**: Si las credenciales están mal, el servidor se niega a arrancar.

## 2. Métodos de Ejecución

### A. `exeRaw(sql, params)`

Para queries rápidas o dinámicas in-line.

```typescript
const res = await db.exeRaw('SELECT count(*) FROM users')
```

### B. `exe(schema, query, params)` (Parameter Store)

Método clásico. Las queries viven en archivos `.ts` separados.

```typescript
// src/db/queries/auth.ts -> export const getUser = "SELECT..."
await db.exe('auth', 'getUser', [email])
```

### C. `exeNamed` (La Joya de la Corona)

Resuelve el problema de los parámetros posicionales (`$1, $2... $20`).
Permite bindear objetos validando claves.

**SQL**:

```sql
INSERT INTO users (name, email) VALUES ($1, $2)
```

**Código**:

```typescript
// Validará que el objeto tenga 'name' y 'email', y los pondrá en orden correcto.
await db.exeNamed('users', 'create', formData, ['name', 'email'])
```

---

## 3. Transacciones (ACID)

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
