# Gestión de Sesiones (Sessions)

El sistema maneja el estado del usuario usando Cookies HTTP-Only firmadas y almacenamiento persistente en Base de Datos.

## ¿Por qué no JWT (Stateless)?

Aunque los JWTs son populares, tienen problemas graves de revocación (no puedes "desloguear" a alguien instantáneamente sin complejidad extra).
Las sesiones en base de datos son:

- **Revocables**: Borras la fila en la DB y el usuario cae inmediatamente.
- **Seguras**: El cliente solo tiene un ID opaco (`connect.sid`), no datos.
- **Limitadas**: Puedes listar "Dispositivos activos" y cerrar uno específico.

## Arquitectura de Cookies

Configuración por defecto en `SessionService`:

| Atributo   | Valor            | Razón                                                                                           |
| :--------- | :--------------- | :---------------------------------------------------------------------------------------------- |
| `httpOnly` | `true`           | JavaScript del navegador NO puede leer la cookie. Protección total contra XSS robando sesiones. |
| `secure`   | `true` (en Prod) | Solo viaja por HTTPS.                                                                           |
| `sameSite` | `strict`         | La cookie no se envía si vienes de otro sitio (protección CSRF extra).                          |
| `maxAge`   | 14 días          | Duración de la sesión.                                                                          |

## Almacenamiento (`connect-pg-simple`)

Las sesiones NO se guardan en memoria RAM (para que el servidor pueda reiniciarse sin desconectar a todos). Se guardan en la tabla `session` de Postgres.

### Esquema de Tabla `session`

| Columna  | Tipo      | Descripción                                             |
| :------- | :-------- | :------------------------------------------------------ |
| `sid`    | PK        | ID de sesión (el que va en la cookie).                  |
| `sess`   | JSON      | Datos de la sesión (user_id, profile_id, carrito, etc). |
| `expire` | Timestamp | Cuándo debe borrarse automáticamente.                   |

## Uso en Código

Desde cualquier lugar con acceso al request (`req`):

```typescript
// Leer
const userId = req.session.user_id

// Escribir (Persiste automáticamente al final del request)
req.session.cart = { items: [] }

// Destruir (Logout)
req.session.destroy()
```
