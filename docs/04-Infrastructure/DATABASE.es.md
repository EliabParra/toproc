# Base de Datos (Database)

El componente `db` es tu puente hacia PostgreSQL. Usa un pool de conexiones para alta eficiencia.

## Ejecución de Consultas (`db.exe`)

No necesitas obtener una conexión manual. Usa el helper `exe` para ejecutar SQL seguro.

```typescript
// En tu Repository
async findUser(id: number) {
    const sql = 'SELECT * FROM users WHERE id = $1';
    // $1 se reemplaza por 'id' automáticamente (evita SQL Injection)
    const result = await this.db.exe(sql, [id]);

    // Result devuelve un array de filas
    return result[0]; // Retorna la primera fila o undefined
}
```

## Transacciones de Base de Datos

Si necesitas hacer dos cosas y que ambas funcionen o fallen juntas (Atomicidad):

```typescript
// Ejemplo conceptual
await this.db.tx(async (client) => {
    await client.query('INSERT INTO sales ...')
    await client.query('UPDATE inventory ...')
})
```

## Configuración

La conexión se configura en `.env` (ver [Guía de Entorno](../01-Getting-Started/ENVIRONMENT.es.md)).
