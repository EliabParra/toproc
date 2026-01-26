# Error Handling

If something goes wrong, the system should notify gracefully, not explode.

## Philosophy

Instead of throwing "raw" errors (`throw new Error`), our BOs return standardized responses.

### Success Response (`this.ok`)

```typescript
return this.ok({ id: 1, name: 'Pepe' })
// Returns: { ok: true, data: { ... } } (HTTP 200)
```

### Controlled Error Response (`this.error`)

Use this when the user does something wrong (business rule).

```typescript
return this.error('User already exists')
// Returns: { ok: false, error: '...' } (HTTP 400 default)
```

### Critical Error Response (`throw`)

Use this when the system fails unexpectedly (Bug, DB down).

```typescript
throw new Error('Database disconnected')
// Framework catches this, logs it, and returns HTTP 500 "Internal Server Error"
```

## HTTP Codes

The framework decides the HTTP code automatically, but you can force it if needed (rarely).

- **200 OK**: All good.
- **400 Bad Request**: Validation failed or business error.
- **401 Unauthorized**: Not logged in.
- **403 Forbidden**: Logged in but no permission.
- **500 Internal Error**: Oops, our fault.
