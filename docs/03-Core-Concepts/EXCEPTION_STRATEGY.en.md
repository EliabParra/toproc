# Exception Strategy

Our philosophy is: **"Fail Safe, Fail Fast, Report Everything"**.

## 1. Error Types

### A. Controlled Errors (4XX)

Part of business flow. System works correctly, but user made a mistake or doesn't meet requirements.

- `Validation Error`: Malformed data.
- `Permission Denied`: User no access.
- `Business Logic`: "Insufficient balance".

**Action**: Use `this.error()` or `this.validationError()`. Returns clean JSON. Does NOT pollute server error logs.

### B. Uncontrolled Errors (5XX)

Bugs or infra failures.

- `DB Connection Refused`.
- `Cannot read property of undefined`.

**Action**: `throw new Error()`. AppServer will catch it.

---

## 2. The Safety Net (Global Catch)

In `AppServer`, the `createFinalErrorHandler` middleware wraps the entire request lifecycle.

If uncontrolled exception occurs:

1.  **Catch**: Server does NOT crash.
2.  **Sanitization**: Secrets (passwords, keys) are removed from error message.
3.  **Logging**: Full Stack Trace is written to Error Log, with context (User ID, Request ID).
4.  **Opaque Response**: User is told "Internal Server Error" (no technical details for security).

## 3. HTTP Error Dictionary

| Code  | Helper                   | Usage                   |
| :---- | :----------------------- | :---------------------- |
| `200` | `this.success()`         | Generic OK.             |
| `201` | `this.created()`         | Resource Created.       |
| `400` | `this.validationError()` | Zod/Input Error.        |
| `401` | (Auto per Security)      | No valid session.       |
| `403` | `this.error(msg, 403)`   | No business permission. |
| `404` | `this.error(msg, 404)`   | Resource not found.     |
| `500` | (Auto per Catch)         | System crash.           |
