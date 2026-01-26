# Logging & Audit

The system listens to and notes down everything that happens.

## System Logger (`AppLogger`)

For technical messages (Debugging, Errors).

```typescript
this.logger.info('Starting process X')
this.logger.error('Connection failed', error)
this.logger.warn('High memory usage')
```

Logs can be output in Text format (for humans) or JSON (for machines, like Datadog or CloudWatch), configurable in `.env`.

## Audit Service (`AuditService`)

For business messages (Security, Compliance).
_Who did what and when?_

This service automatically saves critical events to the database (`audit.log` or similar table):

- Successful/Failed logins.
- User creation.
- Configuration changes.

Usually you don't need to call this manually; `SecurityService` and critical BOs already do it.
