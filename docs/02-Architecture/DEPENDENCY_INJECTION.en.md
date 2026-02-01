# Dependency Injection & Lazy Loading

Technical explanation of how the framework manages Business Object dependencies.

## Dependency Architecture

### `BODependencies` Interface

All Business Objects receive their dependencies through a typed interface:

```typescript
// src/types/core.ts
export interface BODependencies {
    db: IDatabase
    log: ILogger
    config: IConfig
    audit: IAuditService
    security: ISecurityService
    session: ISessionService
    v: IValidator
    i18n: II18nService
}
```

### `BaseBO` Base Class

Business Objects extend `BaseBO`, which provides typed access to all dependencies:

```typescript
// src/core/business-objects/BaseBO.ts
export class BaseBO {
    protected readonly db: IDatabase
    protected readonly log: ILogger
    protected readonly config: IConfig
    protected readonly v: IValidator
    protected readonly i18n: II18nService
    // ... other dependencies

    constructor(deps: BODependencies) {
        this.db = deps.db
        this.log = deps.log
        // ... dependency assignment
    }
}
```

## Injection Flow

```
┌──────────────┐     ┌───────────┐     ┌───────────────────────┐
│  foundation  │────▶│ AppServer │────▶│ TransactionController │
│   (create)   │     │  (setup)  │     │       (HTTP)          │
└──────────────┘     └───────────┘     └───────────────────────┘
                                                   │
                                                   ▼
┌───────────────────────┐     ┌────────────────────┐
│  TransactionExecutor  │◀────│   SecurityService  │
│    (dynamic import)   │     │    (orchestrate)   │
└───────────────────────┘     └────────────────────┘
            │
            ▼
  ┌─────────────────────┐
  │   Business Object   │
  │  (BODependencies)   │
  └─────────────────────┘
```

1. **foundation.ts**: Creates core dependencies (`db`, `log`, etc) and `SecurityService`.
2. **AppServer**: Receives `SecurityService` and injects it into `TransactionController`.
3. **TransactionController**: Handles request and invokes `SecurityService.executeMethod()`.
4. **TransactionExecutor**: Dynamically imports the BO and instantiates it with `BODependencies`.
5. **Business Object**: Receives typed dependencies in its constructor.

## Lazy Loading

Business Objects are loaded on-demand to optimize startup time.

### Implementation (`TransactionExecutor.ts`)

```typescript
async execute(objectName: string, methodName: string, params: unknown) {
    // 1. Build module path
    const modulePath = `../../BO/${objectName}/${objectName}BO.js`

    // 2. Dynamic import (only when needed)
    const module = await import(modulePath)
    const BOClass = module[`${objectName}BO`]

    // 3. Instantiate with full dependencies
    const instance = new BOClass(this.deps)

    // 4. Execute method
    return instance[methodName](params)
}
```

### Instance Caching

The `TransactionExecutor` caches BO instances per session to avoid reimporting:

```typescript
private boCache = new Map<string, BaseBO>()

async getBO(objectName: string): Promise<BaseBO> {
    if (!this.boCache.has(objectName)) {
        const instance = await this.importBO(objectName)
        this.boCache.set(objectName, instance)
    }
    return this.boCache.get(objectName)!
}
```

## Advantages

| Feature           | Benefit                                              |
| ----------------- | ---------------------------------------------------- |
| **Strict Typing** | No `any` containers. Explicit dependencies.          |
| **Testability**   | Easy mocking of `db`, `log`, etc. in unit tests.     |
| **Fast Startup**  | Server boots in milliseconds.                        |
| **Isolation**     | Error in one BO doesn't affect others until invoked. |
| **Efficiency**    | Memory allocated only for active contexts.           |

## See Also

- [Bootstrap](./BOOTSTRAP.en.md) - Initialization process
- [AppServer Core](./APPSERVER_CORE.en.md) - HTTP server functionality
- [Security System](./SECURITY_SYSTEM.en.md) - Permissions and transactions
