# Logging System (Logs & Audit)

"If it's not in the logs, it never happened".
Our system distinguishes between **Technical Logs** (for devs) and **Audit Logs** (for business/legal).

## 1. Technical Logs (`AppLogger`)

The `AppLogger` writes to `stdout` (Standard Output). It is designed for containerized environments (Docker/K8s) and follows the 12-Factor App methodology.

### Stream Architecture

We do not write local files (like `server.log`).
**Reason**: Log rotation, compression, and shipping is the responsibility of the infrastructure (AWS CloudWatch, Datadog, ELK), not Node.js.

### Log Levels (Standard Hierarchy)

Configurable in `config.json` or via environment variables. We support 6 hierarchical levels (simplified RFC 5424):

| Level        | Value | Description                                                              |
| ------------ | ----- | ------------------------------------------------------------------------ |
| **CRITICAL** | 60    | Fatal errors. System cannot continue or requires immediate intervention. |
| **ERROR**    | 50    | Operation failures (request level) that do not crash the entire service. |
| **WARN**     | 40    | Anomalies (retries, missing non-critical data).                          |
| **INFO**     | 30    | Normal events (Server start, Request completed). (Default PROD)          |
| **DEBUG**    | 20    | Diagnostics for developers.                                              |
| **TRACE**    | 10    | Extreme granularity (loops, internal variables).                         |

### Configuration (`config.json`)

The system supports granular configuration by categories (modules) and formatting:

```json
"log": {
  "minLevel": "info",
  "format": "json", // 'text' (colors) or 'json' (structured)
  "categories": {
    "Database": "warn",
    "Security": "debug"
  }
}
```

### Automatic Context (`AsyncLocalStorage`)

Thanks to `AsyncLocalStorage`, there is no need to manually pass `requestId` through all layers. The logger injects it automatically.

**Example Output (JSON):**

```json
{
    "time": "2023-10-27T10:00:00Z",
    "level": "info",
    "msg": "Transaction completed",
    "ctx": {
        "requestId": "req-12345",
        "durationMs": 45,
        "category": "Transaction"
    }
}
```

---

## 2. Audit Logs (`AuditService`)

This is a persistent record in Database (`audit_log`).
Immutable and mandatory for certain industries (Fintech, Health).

### Typical Usage

Automatically invoked in `TransactionController` for every transaction, but you can add custom events.

```typescript
await this.audit.log(req, {
    action: 'critical_update',
    object_na: 'User',
    method_na: 'changePassword',
    profile_id: 1,
    details: { target_user_id: 55 },
})
```

### Automatic Events

- `tx_exec`: Successful transaction.
- `tx_error`: Uncontrolled error.
- `tx_denied`: Access attempt without permission (Security).
- `login` / `logout`.
