# Dependency Injection & Lazy Loading

Technical explanation of how the framework manages memory and business object dependencies.

## Dependency Management (`BOService`)

In previous versions, we used a global container. Now, we use **Explicit Dependency Injection** via the `BOService` base class.

```typescript
// src/core/business-objects/BOService.ts
export class BOService {
    constructor(
        protected readonly log: ILogger,
        protected readonly config: IConfig,
        protected readonly db: IDatabase
    ) {}
}
```

### How it flows

1. **Dispatcher**: Creates instances of `db`, `log`, and `config`.
2. **Business Object (BO)**: Receives these dependencies in its constructor (`BODependencies`).
3. **Service Layer**: The BO passes them to the `Service`, which extends `BOService`.

**Benefit**:

- **Type Safety**: No magic "any" container. You know exactly what a Service depends on.
- **Testability**: You can easily mock `db` or `log` when unit testing a Service.
- **Clarity**: Dependencies are explicit in the constructor.

## Lazy Loading

Node.js is fast, but loading thousands of files at startup would slow down boot time. To avoid this, we implement Lazy Loading for Business Objects.

### How it works (`TransactionExecutor.ts`)

```typescript
// Simplified Concept
async execute(objectName, method, params) {
    // 1. Build file path dynamically
    const path = `../../BO/${objectName}/${objectName}BO.js`

    // 2. DYNAMIC Import (only imports when requested)
    const module = await import(path)
    const BOClass = module[`${objectName}BO`]

    // 3. Instantiate & Inject Core Dependencies
    const instance = new BOClass({
        db: this.db,
        log: this.log,
        config: this.config,
        v: this.validator
    })

    // 4. Execute
    return instance[method](params)
}
```

### Advantages

1.  **Instant Boot**: Server starts in milliseconds, regardless of codebase size.
2.  **Error Isolation**: A specific syntax error in one BO won't crash the entire server until that BO is actually called.
3.  **Efficiency**: Memory is allocated only for active contexts.
