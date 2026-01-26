# Business Objects (BO): Business Anatomy

The Business Object (BO) is the supreme class in our architecture. It's where your code "does things".

## Anatomy of a BO

Every BO must inherit from `BaseBO`. This gives it superpowers (access to DB, Logger, Config, etc.) without manually importing them.

```typescript
import { BaseBO, BODependencies } from '../../core/base/BaseBO'
import { UserSchema } from './schemas'

export class UserBO extends BaseBO {
    constructor(deps: BODependencies) {
        // By calling super(deps), we perform automatic dependency injection
        super(deps)
    }

    // This method will become a Transaction (e.g. tx: 101)
    async createUser(params: unknown) {
        // ... logic ...
    }
}
```

## Injected Tools (`this`)

Inside a BO, you have immediate access to:

| Property      | Type           | Description             | Usage Example            |
| :------------ | :------------- | :---------------------- | :----------------------- |
| `this.db`     | `IDatabase`    | Direct Postgres access. | `await this.db.exe(...)` |
| `this.log`    | `ILogger`      | Structured logger.      | `this.log.info('Hello')` |
| `this.config` | `IConfig`      | Typed env variables.    | `this.config.app.port`   |
| `this.v`      | `AppValidator` | Zod Validator.          | `this.validate(...)`     |
| `this.i18n`   | `I18nService`  | Translations.           | `this.i18n.t('hello')`   |

## Standardized Response Pattern

Never, under any circumstance, write `res.send(...)` inside a BO.
A BO doesn't know HTTP exists. Instead, the BO **returns** a uniform response object.

### 1. `this.success(data, msg?)`

Returns code `200`. Use for successful GET, PUT, DELETE.

```typescript
return this.success({ id: 5 }, 'User Found')
// Output: { ok: true, data: { id: 5 }, msg: 'User Found' }
```

### 2. `this.created(data, msg?)`

Returns code `201`. Use only for POST (Creation).

```typescript
return this.created({ id: 6 })
// Output: { ok: true, data: { id: 6 }, code: 201 }
```

### 3. `this.error(msg, code, alerts?)`

Returns controlled errors.

```typescript
return this.error('User inactive', 403)
```

### 4. `this.validationError(alerts)`

Returns code `400` automatically.

```typescript
return this.validationError(['Email is invalid'])
```

---

## Services and Repositories

To keep BO clean (Clean Code), responsibilities should be separated:

- **BO**: Only Validates and Orchestrates.
- **Service**: Contains complex logic (if/else, calculations).
- **Repository**: Only touches SQL.

```typescript
// BO
const data = this.validate(params, schema).data;
this.service.calculateTax(data);

// Service
calculateTax(data) { return data.price * 1.16; }
```
