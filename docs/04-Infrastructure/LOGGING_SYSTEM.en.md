# Logging System (Logs & Audit)

"If it's not in the logs, it never happened".
Our system distinguishes between **Technical Logs** (for devs) and **Audit Logs** (for business/legal).

## 1. Technical Logs (`AppLogger`)

`AppLogger` writes to `stdout` (Standard Output). Designed for containerized environments (Docker/K8s).

### Stream Architecture

We don't write files (`server.log`).
**Reason**: Log rotation, compression, and shipping is infrastructure responsibility (AWS CloudWatch, Datadog, ELK), not Node.js.

### Log Levels

Configurable in `.env` via `LOG_ACTIVATION=[error, info, debug, warn]`.

- **ERROR (0)**: Critical failures. Always active.
- **INFO (1)**: Lifecycle events (Server start).
- **DEBUG (2)**: Raw data for dev. **Turn off in Production**.
- **WARN (3)**: Non-critical anomalies.

### Context (`ctx`)

A log without context is noise. Framework automatically injects metadata.

```json
{
    "level": "error",
    "msg": "DB Connection Timeout",
    "ctx": {
        "requestId": "req-12345",
        "tx": 1001,
        "user": "admin",
        "path": "/toProccess"
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
