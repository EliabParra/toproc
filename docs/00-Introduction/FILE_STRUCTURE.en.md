# Detailed File Structure

Unlike many projects that hide their complexity, ToProccess prefers an explicit structure. Every folder has a unique purpose.

## Quick Visual Reference

```text
/
├── BO/                      [BUSINESS OBJECTS] -> Business Logic
├── docs/                    [DOCUMENTATION] -> Manuals
├── scripts/                 [SCRIPTS] -> Automated tasks
├── src/                     [SOURCE CODE] -> Framework Core
├── test/                    [TESTS] -> Tests
└── ... (root files)
```

---

## Directory Deep Dive

### 1. `BO/` (Business Objects)

**Purpose**: The only place where your business rules live. If you sell shoes, there will be a `Shoes` folder here.
**Content**:

- `XBO.ts`: The controller receiving requests.
- `XService.ts`: Pure logic.
- `XSchema.ts`: Zod validations.
- `XRepository.ts`: SQL queries.

> **Golden Rule**: If you delete the `BO/` folder, the system should start perfectly (albeit doing nothing useful). This proves business is decoupled from the framework.

### 2. `docs/`

**Purpose**: Living project documentation.
**Structure**:

- `00-Introduction`: Philosophy.
- `01-Getting-Started`: Setup guides.
- ... etc.
    > **Note**: We generate API documentation (TypeDoc) inside `docs/api`.

### 3. `src/` (Source)

The framework engine. Divided into very specific areas:

#### `src/api/`

- **AppServer**: The brain connecting Controllers.
- **HTTP**: Express server, middlewares, and routes (`src/api/http`).

#### `src/config/`

- Handles `.env` environment variable loading.
- Validates missing secret keys on startup.

#### `src/core/` (The Sacred Zone)

Here are the base classes that BOs extend.

- `business-objects/`: `BaseBO`, `CrudBO`, `BOService`, `BOError`.

#### `src/services/` (Infrastructure & Utilities)

Consolidated layer for all technical services (Database, Email, Logging, etc.).

- `DatabaseService`: Abstraction for PostgreSQL.
- `EmailService`: Sending emails (SMTP/Log).
- `SecurityService`: Authentication and authorization logic.
- `SessionService`: User session management.
- `LoggerService`: Structured logging.
- `I18nService`: Internationalization.

#### `src/types/`

- `.d.ts` files and global TypeScript definitions.

---

## Root Files

- **`.env.example`**: Environment variables template.
- **`package.json`**: Dependency list and scripts (`pnpm run ...`).
- **`tsconfig.json`**: TypeScript compiler rules (e.g., Strict Mode enabled).
- **`nodemon.json`**: Configuration to restart server on file save.
