# Estrategia de Excepciones (Exception Strategy)

Nuestra filosofía es: **"Fail Safe, Fail Fast, Report Everything"**.

## 1. Tipos de Errores

### A. Errores Controlados (4XX)

Son parte del flujo de negocio. El sistema funciona correctamente, pero el usuario cometió un error o no cumple requisitos.

- `Validation Error`: Datos mal formados.
- `Permission Denied`: Usuario sin acceso.
- `Business Logic`: "Saldo insuficiente".

**Acción**: Usar `this.error()` o `this.validationError()`. Devuelve JSON limpio. NO ensucia los logs de error del servidor.

### B. Errores No Controlados (5XX)

Bugs o fallos de infraestructura.

- `DB Connection Refused`.
- `Cannot read property of undefined`.

**Acción**: `throw new Error()`. El AppServer lo atrapará.

---

## 2. La Red de Seguridad (Global Catch)

En el `AppServer`, el middleware `createFinalErrorHandler` envuelve todo el ciclo de vida.

Si ocurre una excepción no controlada:

1.  **Captura**: El servidor NO crashea.
2.  **Sanitización**: Se eliminan secretos (passwords, keys) del mensaje de error.
3.  **Logging**: Se escribe el Stack Trace completo en el log de Errores, con contexto (User ID, Request ID).
4.  **Respuesta Opaca**: Al usuario se le dice "Error Interno del Servidor" (sin detalles técnicos por seguridad).

## 3. Diccionario de Errores HTTP

| Código | Helper                   | Uso                     |
| :----- | :----------------------- | :---------------------- |
| `200`  | `this.success()`         | OK Genérico.            |
| `201`  | `this.created()`         | Recurso Creado.         |
| `400`  | `this.validationError()` | Error de Zod/Input.     |
| `401`  | (Auto per Security)      | Sin sesión válida.      |
| `403`  | `this.error(msg, 403)`   | Sin permiso de negocio. |
| `404`  | `this.error(msg, 404)`   | Recurso no encontrado.  |
| `500`  | (Auto per Catch)         | Crash del sistema.      |
