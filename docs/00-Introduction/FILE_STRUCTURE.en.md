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

- **Dispatcher**: The brain deciding which BO to execute.
- **Routes**: Express route definitions (though we mainly use a single route `/toProccess`).

#### `src/config/`

- Handles `.env` environment variable loading.
- Validates missing secret keys on startup.

#### `src/core/` (The Sacred Zone)

Here are the base classes that BOs extend.

- `BaseBO`: Parent class with `ok()`, `error()`, `validate()` methods.
- `Transaction`: Interfaces for the transactional system.
- `Security`: `SecurityService` and guards.

#### `src/db/`

- Database abstraction (PostgreSQL).
- Connection `Pool` management.
- `QueryExec` helper to facilitate queries.

#### `src/express/`

- HTTP Server configuration.
- **Middlewares**:
    - `SecurityMiddleware`: Verifies tokens.
    - `RequestLogger`: Logs every request.
    - `Helmet/Cors`: Standard HTTP security.

#### `src/infra/`

Services connecting to "the outside world".

- `EmailService`: Sending emails (SMTP/Log).
- `AuditService`: Recording events in DB.

#### `src/i18n/`

- JSON files with translations (`es.json`, `en.json`).
- Locale loading service.

#### `src/logger/`

- Winston/Pino configuration (whichever logger we use).
- Log rotation.

#### `src/session/`

- User state management (Redis/DB).
- Session serialization.

#### `src/types/`

- `.d.ts` files and global TypeScript definitions so the compiler doesn't complain.

---

## Root Files

- **`.env.example`**: Environment variables template.
- **`package.json`**: Dependency list and scripts (`npm run ...`).
- **`tsconfig.json`**: TypeScript compiler rules (e.g., Strict Mode enabled).
- **`nodemon.json`**: Configuration to restart server on file save.
