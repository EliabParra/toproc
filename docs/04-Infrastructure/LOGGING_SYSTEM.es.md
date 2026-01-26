# Sistema de Logging (Logs & Audit)

"Si no está en los logs, nunca pasó".
Nuestro sistema distingue entre **Logs Técnicos** (para devs) y **Logs de Auditoría** (para negocio/legal).

## 1. Logs Técnicos (`AppLogger`)

El `AppLogger` escribe en `stdout` (Salida Estándar). Está diseñado para entornos contenerizados (Docker/K8s).

### Arquitectura de Streams

No escribimos archivos (`server.log`).
**Razón**: La rotación, compresión y envío de logs es responsabilidad de la infraestructura (AWS CloudWatch, Datadog, ELK), no de Node.js.

### Niveles de Log

Configurables en `.env` mediante `LOG_ACTIVATION=[error, info, debug, warn]`.

- **ERROR (0)**: Fallos críticos. Siempre activo.
- **INFO (1)**: Eventos de ciclo de vida (Server start).
- **DEBUG (2)**: Datos crudos para desarrollo. **Apagar en Producción**.
- **WARN (3)**: Anomalías no críticas.

### Contexto (`ctx`)

Un log sin contexto es ruido. El framework inyecta automáticamente metadatos.

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

## 2. Logs de Auditoría (`AuditService`)

Este es un registro persistente en Base de Datos (`audit_log`).
Es inmutable y obligatorio para ciertas industrias (Fintech, Salud).

### Uso Típico

Se invoca automáticamente en el `Dispatcher` para cada transacción, pero puedes añadir eventos custom.

```typescript
await this.audit.log(req, {
    action: 'critical_update',
    object_na: 'User',
    method_na: 'changePassword',
    profile_id: 1,
    details: { target_user_id: 55 },
})
```

### Eventos Automáticos

- `tx_exec`: Transacción exitosa.
- `tx_error`: Error no controlado.
- `tx_denied`: Intento de acceso sin permisos (Seguridad).
- `login` / `logout`.
