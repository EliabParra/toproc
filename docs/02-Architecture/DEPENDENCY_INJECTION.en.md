# Dependency Injection & Lazy Loading

Technical explanation of how the framework manages memory and objects.

## The Container (`IContainer`)

This object is the "blood" of the system. It flows everywhere.

```typescript
export interface IContainer {
    config: IConfig // Global config (loaded from .env)
    log: ILogger // Logger instance
    db: IDatabase // Active Postgres connection
    audit: IAuditService // Audit service
    // ... other core services
}
```

The `Dispatcher` creates this container once (or reuses it) and passes it to `SecurityService`, which passes it to `BusinessObject`.

**Benefit**:
If tomorrow you want to add a "Push Notifications" service available to everyone, you just add it to the Container in `Dispatcher` and automatically all BOs have access to `this.container.push`.

## Lazy Loading

Node.js is fast, but loading 5000 files at startup would make the server take minutes to boot (poor `npm run dev`).

To avoid this, we implement Lazy Loading in `TransactionExecutor`.

### How it works (`TransactionExecutor.ts`)

```typescript
// Simplified pseudocode
async execute(objectName, method, params) {
    // 1. Build file path
    const path = `./BO/${objectName}/${objectName}BO.js`;

    // 2. DYNAMIC Import (disk is read only now)
    const module = await import(path);
    const BOClass = module[`${objectName}BO`];

    // 3. Instantiate & Inject
    const instance = new BOClass(this.container);

    // 4. Execute
    return instance[method](params);
}
```

### Advantages

1.  **Instant Boot**: Server starts in milliseconds, regardless of whether you have 10 or 1000 BOs.
2.  **Error Isolation**: If a BO has a syntax error, it doesn't break the server until someone tries to use THAT specific BO.
3.  **Less Memory**: Node.js can release memory from unused modules (depending on Garbage Collector).
