# Sistema de Logging (Logs & Audit)

"Si no está en los logs, nunca pasó".
Nuestro sistema distingue entre **Logs Técnicos** (para devs) y **Logs de Auditoría** (para negocio/legal).

## 1. Logs Técnicos (`AppLogger`)

El `AppLogger` escribe en `stdout` (Salida Estándar). Está diseñado para entornos contenerizados (Docker/K8s) y sigue el estándar 12-Factor App.

### Arquitectura de Streams

No escribimos archivos locales (como `server.log`).
**Razón**: La rotación, compresión y envío de logs es responsabilidad de la infraestructura (AWS CloudWatch, Datadog, ELK), no de Node.js.

### Niveles de Log (Jerarquía Estándar)

Configurables en `config.json` o variables de entorno. Soportamos 6 niveles jerárquicos (RFC 5424 simplificado):

| Nivel        | Valor | Descripción                                                                       |
| ------------ | ----- | --------------------------------------------------------------------------------- |
| **CRITICAL** | 60    | Errores fatales. El sistema no puede continuar o requiere intervención inmediata. |
| **ERROR**    | 50    | Fallos en operaciones (nivel request) que no tiran el servicio completo.          |
| **WARN**     | 40    | Anomalías (reintentos, datos faltantes no críticos).                              |
| **INFO**     | 30    | Eventos normales (Server start, Request completado). (Default PROD)               |
| **DEBUG**    | 20    | Diagnóstico para desarrolladores.                                                 |
| **TRACE**    | 10    | Granularidad extrema (ciclos, variables internas).                                |

### Configuración (`config.json`)

El sistema soporta configuración granular por categorías (módulos) y formateo:

```json
"log": {
  "minLevel": "info",
  "format": "json", // 'text' (colores) o 'json' (estructurado)
  "categories": {
    "Database": "warn",
    "Security": "debug"
  }
}
```

### Contexto Automático (`AsyncLocalStorage`)

Gracias al uso de `AsyncLocalStorage`, no es necesario pasar el `requestId` manualmente por todas las capas. El logger lo inyecta automáticamente.

**Ejemplo de salida (JSON):**

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

## 2. Logs de Auditoría (`AuditService`)

Este es un registro persistente en Base de Datos (`audit_log`).
Es inmutable y obligatorio para ciertas industrias (Fintech, Salud).

### Uso Típico

Se invoca automáticamente en el `TransactionController` para cada transacción, pero puedes añadir eventos custom.

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
