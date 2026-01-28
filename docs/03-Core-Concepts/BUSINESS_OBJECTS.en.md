# Business Objects (BO): Business Anatomy

The Business Object (BO) is the core class in our architecture. It's where your code "does things".

## Anatomy of a BO

Every BO inherits from `BaseBO`. This gives it superpowers (access to DB, Logger, Config, etc.) and standardized execution methods.

```typescript
import { BaseBO, BODependencies } from '../../src/core/business-objects/BaseBO.js'
import { UserSchemas, CreateUserInput } from './User.Schemas.js'
import { UserService } from './User.Service.js'

export class UserBO extends BaseBO {
    private service: UserService

    constructor(deps?: BODependencies) {
        super(deps)
        this.service = new UserService(this.log, this.config, this.db)
    }

    // Standard Method
    async createUser(params: CreateUserInput): Promise<ApiResponse> {
        return this.exec<CreateUserInput, void>(params, UserSchemas.create, async (data) => {
            // 'data' is already validated here
            await this.service.create(data)
            return this.created(null, 'User Created')
        })
    }
}
```

## The `.exec()` Pattern

Instead of writing repetitive `try/catch` and `validate` blocks, use `this.exec()`.

**It handles**:

1. **Validation**: Checks `params` against the Zod schema. Returns 400 if invalid.
2. **Execution**: Runs your callback function.
3. **Error Handling**: Catches errors, checks if they are `BOError`, and returns appropriate 4xx/500 codes.

## Injected Tools

Inside a BO, you have access to:

| Property      | Type        | Description                  |
| :------------ | :---------- | :--------------------------- |
| `this.db`     | `IDatabase` | Direct Postgres access.      |
| `this.log`    | `ILogger`   | Structured logger.           |
| `this.config` | `IConfig`   | Typed environment variables. |

## CrudBO: Rapid Development

For standard CRUD resources, extend `CrudBO`.

```typescript
export class ProductBO extends CrudBO<Product, CreateProduct, UpdateProduct> {
    constructor(deps?: BODependencies) {
        super('products', 'product_id', deps) // Table name, ID column
    }

    // Auto-generates: get, list, delete.
    // You only implement specialized methods.
}
```

## Services & BOError

To keep code clean:

- **BO**: Orchestrates (HTTP -> BO -> Service).
- **Service**: Extends `BOService`. Contains pure business logic.
- **BOError**: Use this for domain errors.

```typescript
// Service
import { BOService } from '../../src/core/business-objects/BOService.js'

export class UserService extends BOService {
    async create(data: UserData) {
        if (await this.repo.exists(data.email)) {
            throw new UserAlreadyExistsError() // Extends BOError
        }
        // ...
    }
}
```
