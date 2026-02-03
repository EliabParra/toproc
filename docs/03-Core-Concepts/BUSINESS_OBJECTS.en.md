# Business Objects (BO): Business Anatomy

The Business Object (BO) is the supreme class in our architecture. It is where your code "does things".

## Anatomy of a BO

Every BO must inherit from `BaseBO`. This gives it superpowers (access to DB, Logger, Config, Validator, etc.) and standardized execution methods.

```typescript
import { BaseBO, BODependencies, ApiResponse } from '../../src/core/business-objects/index.js'
import {
    UserRepository,
    UserService,
    UserMessages,
    createUserSchemas,
    Schemas,
} from './UserModule.js'
import type { Types } from './UserModule.js'

export class UserBO extends BaseBO {
    private service: UserService

    constructor(deps: BODependencies) {
        super(deps)
        const repo = new UserRepository(this.db)
        this.service = new UserService(repo, this.log, this.config, this.db)
    }

    // Typed accessors for i18n and validation
    private get userMessages() {
        return this.i18n.use(UserMessages)
    }

    private get userSchemas() {
        return createUserSchemas(this.userMessages)
    }

    // Standard Method
    async create(params: Schemas.CreateInput): Promise<ApiResponse> {
        return this.exec<Schemas.CreateInput, Types.User>(
            params,
            this.userSchemas.create,
            async (data) => {
                const user = await this.service.create(data)
                return this.created(user, this.userMessages.createSuccess) // ← Typed message
            }
        )
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

| Property            | Type           | Description                    |
| :------------------ | :------------- | :----------------------------- |
| `this.db`           | `IDatabase`    | Direct access to Postgres.     |
| `this.log`          | `ILogger`      | Structured logger.             |
| `this.config`       | `IConfig`      | Typed environment variables.   |
| `this.i18n`         | `II18nService` | Internationalization service.  |
| `this.validator`    | `IValidator`   | Validation service (Zod).      |
| `this.userMessages` | (getter)       | Typed messages for current BO. |

## 9-File Structure

Each BO generates **9 files** with the nomenclature `{Name}{Type}.ts`:

```
BO/User/
├── 📦 UserBO.ts            # Business Object (main file)
├── 🧠 UserService.ts       # Business Logic
├── 🗄️ UserRepository.ts    # Database Access
├── 🔍 UserQueries.ts       # Colocated SQL
├── ✅ UserSchemas.ts        # Zod Validations
├── 📘 UserTypes.ts          # TypeScript Interfaces
├── 💬 UserMessages.ts       # I18n strings (ES/EN)
├── ❌ UserErrors.ts         # Custom Error Classes
└── 📦 UserModule.ts         # Module barrel exports
```

## Services and BOError

To keep code clean:

- **BO**: Orchestrates (HTTP -> BO -> Service).
- **Service**: Extends `BOService`. Contains pure business logic.
- **Repository**: Uses `db.query<T>` with types and colocated SQL.
- **BOError**: Use it for domain errors.

```typescript
// Repository
import { IDatabase } from '../../src/core/business-objects/index.js'
import { UserQueries, Types } from './UserModule.js'

export class UserRepository implements Types.IUserRepository {
    constructor(private db: IDatabase) {}

    async findById(id: number): Promise<Types.User | null> {
        const result = await this.db.query<Types.User>(UserQueries.findById, [id])
        return result.rows[0] ?? null
    }
}
```

```typescript
// Service
import { BOService, IConfig, IDatabase } from '../../src/core/business-objects/index.js'
import type { ILogger } from '../../src/types/core.js'
import { Errors, Types, UserRepository } from './UserModule.js'

export class UserService extends BOService implements Types.IUserService {
    constructor(
        private repo: UserRepository,
        log: ILogger,
        config: IConfig,
        db: IDatabase
    ) {
        super(log, config, db)
    }

    async create(data: Types.CreateUserData) {
        if (await this.repo.exists(data.email)) {
            throw new Errors.UserAlreadyExistsError(data.email) // Extends BOError
        }
        // ...
    }
}
```
