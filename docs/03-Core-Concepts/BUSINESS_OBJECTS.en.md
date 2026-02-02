# Business Objects (BO): Business Anatomy

The Business Object (BO) is the supreme class in our architecture. It is where your code "does things".

## Anatomy of a BO

Every BO must inherit from `BaseBO`. This gives it superpowers (access to DB, Logger, Config, Validator, etc.) and standardized execution methods.

```typescript
import { BaseBO, BODependencies } from '../../src/core/business-objects/BaseBO.js'
import { UserRepository } from './User.Repository.js'
import { UserService } from './User.Service.js'
import { UserSchemas, CreateInput } from './User.Schemas.js'
import { UserMessages } from './User.Messages.js'

export class UserBO extends BaseBO {
    private service: UserService

    constructor(deps: BODependencies) {
        super(deps)
        const repo = new UserRepository(this.db)
        this.service = new UserService(repo, this.log, this.config, this.db)
    }

    // Typed accessor for i18n messages
    private get m() {
        return this.i18n.use(UserMessages)
    }

    // Standard Method
    async create(params: CreateInput): Promise<ApiResponse> {
        return this.exec<CreateInput, void>(params, UserSchemas.create, async (data) => {
            await this.service.create(data)
            return this.created(null, this.m.createSuccess) // ← Typed message
        })
    }
}
```

## The `.exec()` Pattern

Instead of writing repetitive `try/catch` and `validate` blocks, use `this.exec()`.

**Handles for you**:

1. **Validation**: verifies `params` against Zod schema. Returns 400 if invalid.
2. **Execution**: Runs your callback function.
3. **Error Handling**: Captures errors, checks if they are `BOError` and returns appropriate 4xx/500 codes.

## Injected Tools

Inside a BO, you have access to:

| Property         | Type           | Description                    |
| :--------------- | :------------- | :----------------------------- |
| `this.db`        | `IDatabase`    | Direct access to Postgres.     |
| `this.log`       | `ILogger`      | Structured logger.             |
| `this.config`    | `IConfig`      | Typed environment variables.   |
| `this.i18n`      | `II18nService` | Internationalization service.  |
| `this.validator` | `IValidator`   | Validation service (Zod).      |
| `this.m`         | (getter)       | Typed messages for current BO. |

## 8-File Structure

Each BO generates **8 files** with the nomenclature `{Name}.{Type}.ts`:

```
BO/User/
├── 📦 UserBO.ts            # Business Object (main file)
├── 🧠 User.Service.ts      # Business Logic
├── 🗄️ User.Repository.ts   # Database Access
├── 🔍 User.Queries.ts      # Colocated SQL
├── ✅ User.Schemas.ts       # Zod Validations
├── 📘 User.Types.ts         # TypeScript Interfaces
├── 💬 User.Messages.ts      # I18n strings (ES/EN)
└── ❌ User.Errors.ts        # Custom Error Classes
```

## Services and BOError

To keep code clean:

- **BO**: Orchestrates (HTTP -> BO -> Service).
- **Service**: Extends `BOService`. Contains pure business logic.
- **Repository**: Uses `db.query<T>` with types and colocated SQL.
- **BOError**: Use it for domain errors.

```typescript
// Repository
import { IDatabase } from '../../src/types/core.js'
import { UserQueries } from './User.Queries.js'
import { User } from './User.Types.js'

export class UserRepository {
    constructor(private db: IDatabase) {}

    async findById(id: number): Promise<User | null> {
        const result = await this.db.query<User>(UserQueries.findById, [id])
        return result.rows[0] ?? null
    }
}
```

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
