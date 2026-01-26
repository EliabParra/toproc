# Logging y Auditoría (Logging & Audit)

El sistema escucha y anota todo lo que pasa.

## Logger del Sistema (`AppLogger`)

Para mensajes técnicos (Debugging, Errores).

```typescript
this.logger.info('Iniciando proceso X')
this.logger.error('Falló la conexión', error)
this.logger.warn('Uso de memoria alto')
```

Los logs pueden salir en formato Texto (para humanos) o JSON (para máquinas, como Datadog o CloudWatch), confiugrable en `.env`.

## Servicio de Auditoría (`AuditService`)

Para mensajes de negocio (Seguridad, Cumplimiento).
_¿Quién hizo qué y cuándo?_

Este servicio guarda automáticamente en base de datos (`audit.log` o tabla similar) eventos críticos:

- Logins exitosos/fallidos.
- Creación de usuarios.
- Cambios de configuración.

Normalmente no necesitas llamar a esto manualmente, el `SecurityService` y los BOs críticos ya lo hacen.
