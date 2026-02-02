# Unified Security System

Security in ToProccess is the foundation of the architecture.
It is based on a **Transaction-Oriented** model where every business action has a unique ID, granular permissions, and securely orchestrated execution.

## 1. Concept: Transaction-Oriented Security

Instead of exposing traditional CRUD resources (`POST /users`), we expose Business Intentions (`tx: 1001` -> "Register User").

**Advantages**:

1.  **Decoupling**: The frontend doesn't know `UserBO` exists. It only knows ID `1001`.
2.  **Audit**: Trivial to track who executed transaction `1001` and when.
3.  **Refactoring**: You can rename methods without breaking clients.
4.  **Deny by Default**: If a transaction doesn't have explicit permission in the DB, no one can execute it.

---

## 2. New Architecture (Core Refactor)

We have separated responsibilities into specialized components to comply with **SOLID** and enhance security:

### A. Permission Matrix (`security.permissions`)

Authorization is based on the database, loaded into RAM (`PermissionGuard`) for O(1) speed.

| transaction_id (`tx`) | profile_id | description        |
| :-------------------- | :--------- | :----------------- |
| 1001 (Register)       | 2 (Public) | Allowed for guests |
| 1002 (Admin Panel)    | 1 (Admin)  | Admins only        |

### B. Core Components (`src/core/*`)

1.  **TransactionOrchestrator** (The Director):
    - Receives request from controller.
    - Coordinates: Resolution -> Route Validation -> AuthZ -> Execution -> Audit.
    - **Security**: Validates method names against a whitelist (Regex) to prevent arbitrary execution.

2.  **AuthorizationService** (The Guardian):
    - Solely responsible for permissions (YES/NO).
    - Consults `PermissionGuard`.
    - Logs denied access attempts.

3.  **TransactionExecutor** (The Executor):
    - Dynamically loads the Business Object (BO).
    - **Critical Security**: Implements **Path Containment**. Verifies the file to load is strictly within `/BO` and checks for path traversal (`../../etc/passwd`).
    - Injects dependencies (DB, Log, Validator, I18n).

4.  **TransactionMapper** (The Map):
    - Translates `tx: 1001` -> `{ object: "Auth", method: "register" }`.

---

## 3. Secure Flow

1. **Resolution**: `TransactionMapper` finds the route.
2. **Route Validation (Anti-Traversal)**: `TransactionOrchestrator` checks for illegal characters.
3. **Authorization**: `AuthorizationService` verifies permission matrix.
4. **Secure Execution**: `TransactionExecutor` resolves absolute path, ensures root containment, and executes.
5. **Audit**: Success or error is logged.

---

## 4. Special Profiles

- **Public Profile (Configurable ID)**:
    - Automatically used when a user has no session.
    - Defines what an anonymous user can do.
- **Super Admin (ID 1)**:
    - Typically has access to everything, but handled as just another profile.
    - No hardcoded "if (admin) bypass".

---

## 5. Additional Layers

1.  **CSRF (Cross-Site Request Forgery)**:
    - Synchronized token in cookie and header.
2.  **Rate Limiting**:
    - Strict strategies for sensitive endpoints (`/login`).
