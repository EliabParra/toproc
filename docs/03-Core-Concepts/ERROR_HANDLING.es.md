# Manejo de Errores (Error Handling)

Si algo sale mal, el sistema debe avisar con elegancia, no explotar.

## La Filosofía

En lugar de lanzar errores "crudos" (`throw new Error`), nuestros BOs devuelven respuestas estandarizadas.

### Respuesta Exitosa (`this.ok`)

```typescript
return this.ok({ id: 1, name: 'Pepe' })
// Retorna: { ok: true, data: { ... } } (HTTP 200)
```

### Respuesta de Error Controlado (`this.error`)

Úsalo cuando el usuario hace algo mal (regla de negocio).

```typescript
return this.error('El usuario ya existe')
// Retorna: { ok: false, error: '...' } (HTTP 400 por defecto)
```

### Respuesta de Error Crítico (`throw`)

Úsalo cuando el sistema falla inesperadamente (Bug, DB caída).

```typescript
throw new Error('Database disconnected')
// El sistema captura esto, lo loguea y retorna HTTP 500 "Internal Server Error"
```

## Códigos HTTP

El framework decide el código HTTP automáticamente, pero puedes forzarlo si lo necesitas (rara vez).

- **200 OK**: Todo bien.
- **400 Bad Request**: Validación fallida o error de negocio.
- **401 Unauthorized**: No estás logueado.
- **403 Forbidden**: Estás logueado pero no tienes permiso.
- **500 Internal Error**: Ups, culpa nuestra.
