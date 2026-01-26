# Business Objects (BOs)

A **Business Object** (BO) is an independent module that groups everything needed for a business feature (e.g., `Users`, `Products`, `Sales`).

## Anatomy of a BO

To keep things organized, we divide the BO into 3 internal layers:

```mermaid
graph TD
    API[Dispatcher] --> Controller[BO (Controller)]
    Controller --> Service[Service (Logic)]
    Service --> Repo[Repository (Data)]
    Repo --> DB[(Database)]

    classDef bo fill:#f9f,stroke:#333;
    class Controller,Service,Repo bo;
```

### 1. The Controller (`XBO.ts`)

The "public face" of the module.

- **Responsibility**: Receive data, validate (`validate`), call the service, and respond (`ok`/`error`).
- **Never**: Does direct SQL queries or complex logic.
- **Analogy**: The restaurant waiter. Takes your order, checks if you ordered something valid, and passes it to the kitchen.

### 2. The Service (`XService.ts`)

The "brain" or "kitchen".

- **Responsibility**: Business rules. Calculate prices, check stock, send emails.
- **Never**: Speaks HTTP (req/res) or writes direct SQL.
- **Analogy**: The chef. Knows how to cook the dish, but doesn't care who ordered it.

### 3. The Repository (`XRepository.ts`)

The "warehouse".

- **Responsibility**: Talk to the database (SQL). `SELECT`, `INSERT`, `UPDATE`.
- **Never**: Makes business decisions. Just saves and retrieves data.
- **Analogy**: The pantry manager. Give me 3 eggs and 1kg of flour.

## Code Example

```typescript
// UserController (BO)
async createUser(data) {
    if (!this.valid(data)) return this.error('Invalid data');
    return this.service.create(data);
}

// UserService
async create(user) {
    if (user.age < 18) throw new Error('Too young');
    return this.repo.save(user);
}

// UserRepository
async save(user) {
    return this.db.query('INSERT INTO users...', [user.name]);
}
```
