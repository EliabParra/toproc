# Referencia API (API Reference & Messaging Standard)

Esta guía define el contrato estricto de comunicación entre Cliente y Servidor.

## 1. Estándar de Mensajería (The Protocol)

ToProccess no es un API RESTful pura. Es un API **Transaction-Oriented**.
Usa un único endpoint para procesar comandos de negocio.

### Request Envelope (La Petición)

**Endpoint**: `POST /toProccess`
**Headers**: `Content-Type: application/json`

```json
{
    "tx": 1001, // (Requerido) ID de Transacción. Define la INTENCIÓN.
    "params": {
        // (Opcional) Datos necesarios para ejecutarla.
        "userId": 55,
        "filters": { "active": true }
    }
}
```

### Response Envelope (La Respuesta)

El servidor siempre responde con una estructura predecible de 3 partes.

```json
{
  "code": 200,          // Espejo del Status HTTP. Para facilitar lectura en cliente.
  "msg": "OK",          // Mensaje humano corto. (Ej: "Usuario Creado", "Error de Validación").
  "data": { ... }       // Payload de éxito (solo si code 2xx).
  // Ó
  "alerts": ["..."]     // Lista de errores (solo si code 4xx/5xx).
}
```

---

## 2. Códigos de Estado Comunes

| Código  | Significado       | Causa Común                                     |
| :------ | :---------------- | :---------------------------------------------- |
| **200** | OK                | Operación exitosa.                              |
| **201** | Created           | Registro creado exitosamente.                   |
| **400** | Bad Request       | Error de validación (revisar `alerts`).         |
| **401** | Unauthorized      | Cookie de sesión expirada o inexistente.        |
| **403** | Forbidden         | Usuario logueado pero sin permiso para esta TX. |
| **404** | Not Found         | El recurso pedido (ej. usuario ID) no existe.   |
| **429** | Too Many Requests | Rate limit excedido. Calma tus clicks.          |
| **500** | Internal Error    | Bug del servidor. Contactar soporte.            |

---

## 3. Diccionario de Endpoints Auxiliares

Aunque `/toProccess` es el rey, existen endpoints de soporte:

- `GET /health`: Devuelve `200 OK` si el servidor corre. (Para Load Balancers).
- `GET /ready`: Verifica conexión a DB. (Para K8s Readiness Probe).
- `GET /csrf`: Obtiene el token CSRF para formularios.
- `POST /login`: Autenticación y creación de sesión.
- `POST /logout`: Destrucción de sesión.
