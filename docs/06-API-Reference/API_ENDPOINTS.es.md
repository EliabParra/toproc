# Referencia API (API Reference)

## Endpoints HTTP

El framework minimiza la cantidad de endpoints para simplificar la seguridad.

### 1. Endpoint Principal (`POST /toProccess`)

Es la puerta de entrada para todas las operaciones de negocio.

**Request:**

```json
POST /toProccess
Content-Type: application/json
Authorization: Bearer <token>

{
  "tx": 101,          // ID de la Transacción
  "data": { ... }     // Parámetros para el BO
}
```

**Response (Éxito 200):**

```json
{
  "ok": true,
  "data": { ... }
}
```

**Response (Error 4xx/5xx):**

```json
{
    "ok": false,
    "error": "Mensaje de error legible"
}
```

### 2. Health Check (`GET /health`)

Para monitoreo (Kubernetes, AWS LB).

- Retorna 200 `OK`.

### 3. Documentación Generada (`GET /api-docs`)

Si generaste la documentación con `npm run docs:gen`, estará disponible aquí (si se sirve estáticamente).

## Diccionario de Códigos de Error

| Código              | Significado                    | Acción Sugerida      |
| :------------------ | :----------------------------- | :------------------- |
| `ERR_AUTH_FAIL`     | Usuario/Password incorrectos   | Reintentar login     |
| `ERR_NO_PERMISSION` | Login correcto pero sin acceso | Contactar admin      |
| `ERR_VALIDATION`    | Datos mal formados (Zod)       | Corregir formulario  |
| `ERR_DB_CONN`       | Base de datos caída            | Reintentar más tarde |
