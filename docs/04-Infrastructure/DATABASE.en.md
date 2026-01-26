# Database

The `db` component is your bridge to PostgreSQL. It uses a connection pool for high efficiency.

## Query Execution (`db.exe`)

You don't need to get a connection manually. Use the `exe` helper for safe SQL execution.

```typescript
// In your Repository
async findUser(id: number) {
    const sql = 'SELECT * FROM users WHERE id = $1';
    // $1 is replaced by 'id' automatically (prevents SQL Injection)
    const result = await this.db.exe(sql, [id]);

    // Result returns an array of rows
    return result[0]; // Return the first row or undefined
}
```

## Database Transactions

If you need to do two things and have both succeed or fail together (Atomicity):

```typescript
// Conceptual example
await this.db.tx(async (client) => {
    await client.query('INSERT INTO sales ...')
    await client.query('UPDATE inventory ...')
})
```

## Configuration

Connection is configured in `.env` (see [Environment Guide](../01-Getting-Started/ENVIRONMENT.en.md)).
