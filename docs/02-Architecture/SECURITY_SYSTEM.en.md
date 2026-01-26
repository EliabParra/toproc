# Unified Security System

Security in ToProccess is the architectural foundation.
It is based on a **Transaction-Oriented** model where every business action has a unique ID and granular permissions.

## 1. Concept: Transaction-Oriented Security

Instead of exposing traditional REST CRUD resources (`POST /users`), we expose Business Intents (`tx: 1001` -> "Register User").

**Advantages**:

1.  **Decoupling**: Frontend doesn't know `UserBO` class exists. Only knows ID `1001`.
2.  **Audit**: It's trivial to know who executed transaction `1001` and when.
3.  **Refactoring**: You can rename methods without breaking clients.
4.  **Deny by Default**: If a transaction has no explicit permission in DB, no one can execute it.

---

## 2. Key Components

### A. Permission Matrix (DB -> RAM)

All authorization is based on `security.permissions` table.

| transaction_id (`tx`) | profile_id | description          |
| :-------------------- | :--------- | :------------------- |
| 1001 (Register)       | 2 (Public) | Allowed to anonymous |
| 1002 (Admin Panel)    | 1 (Admin)  | Admins only          |

**PermissionGuard (`PermissionGuard.ts`)**:
Loads this full table into RAM at server start (O(1) Lookup Map).

- **Speed**: Permission check takes nanoseconds.
- **Consistency**: No SQL queries per request to verify auth.

### B. Transaction Mapper (`TransactionMapper.ts`)

The dictionary translating numbers to code.

```json
// security.transactions
{
    "1001": { "object": "Auth", "method": "register" },
    "1002": { "object": "Dashboard", "method": "getData" }
}
```

### C. SecurityService (The Guardian)

The service orchestrating everything.

1. Receives `tx: 1001`.
2. Calls Mapper -> `Auth.register`.
3. Calls Guard -> `Does Profile X have permission for Auth.register?`.
4. If YES -> Executes BO.
5. If NO -> Logs incident and returns 403.

---

## 3. Special Profiles

- **Public Profile (Configurable ID)**:
    - Used automatically when user has no session (cookie).
    - Defines what an anonymous user can do (Login, Register, Password Reset).
- **Super Admin (ID 1)**:
    - Typically has access to everything, but system treats it as just another profile.
    - No hardcoded "if (admin) bypass" in code, everything is in DB.

---

## 4. Additional Layers

1.  **CSRF (Cross-Site Request Forgery)**:
    - Synchronized token in cookie and header.
    - Prevents other sites from executing `tx` on behalf of user.
2.  **Rate Limiting**:
    - `LoginRateLimiter`: 5 attempts/minute (Strict).
    - `AppRateLimiter`: 100 requests/minute (Lax).
