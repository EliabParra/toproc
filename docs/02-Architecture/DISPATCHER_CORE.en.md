# Dispatcher Core: The HTTP Brain

The `Dispatcher` is the single entry point to the system. There is no giant `routes.ts` file.
All routing logic is centralized here to ensure consistency and security.

## Initialization Lifecycle (`init()`)

When you call `await dispatcher.init()`, these critical steps happen:

1.  **Config Load**: Dependencies are injected (`ILogger`, `IConfig`, etc).
2.  **Security Middlewares**:
    - `Helmet`: Secure HTTP headers.
    - `CORS`: Cross-origin access control.
    - `RateLimit`: Brute force protection (Login: strict, API: lax).
    - `CSRF`: Cross-Site Request Forgery protection (Token in cookie).
3.  **Parsing Middlewares**:
    - `BodyParser`: Strict JSON. If you send malformed JSON, a special middleware captures it before crashing the server.
4.  **Sessions**: The session manager is "plugged in" (`connect-pg-simple` with Postgres).

## The Master Route: `/toProccess`

99% of your API happens in this POST endpoint.

```typescript
this.app.post(
    '/toProccess',
    rateLimiter, // 1. Prevents spam
    csrfProtection, // 2. Validates CSRF token
    this.toProccess // 3. Executes logic
)
```

### Internal Logic of `toProccess`

1.  **Session Validation**:
    - Has valid cookie? -> Retrieve `profile_id`.
    - No cookie? -> Assign public `profile_id` (configured in .env).
    - If route requires login and no session, reject with `401`.

2.  **Structure Validation**:
    - Uses `parseToProccessBody` to ensure JSON has `{ tx: number, params: object }`.

3.  **Transaction Resolution**:
    - Asks `SecurityService`: "What does tx 1001 mean?".
    - Answer: `Auth.login`.

4.  **Permission Verification**:
    - Consults memory matrix: "Can profile X execute Auth.login?".
    - If no -> Logs incident in Audit and responds `403`.

5.  **Execution**:
    - Invokes `SecurityService.executeMethod()`.
    - Records success/failure in Audit.

## Global Error Handling

The Dispatcher wraps everything in a giant `try/catch`.

- If a BO does `throw new Error('Boom')`:
    - User receives: `500 Server Error`.
    - Log receives: `Error: Boom at line 50...` (Full Stack Trace).
- This prevents "Information Leakage" to the attacker.
