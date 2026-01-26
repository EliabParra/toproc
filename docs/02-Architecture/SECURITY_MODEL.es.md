# Modelo de Seguridad (Security Model)

La seguridad es el guardia en la puerta del club. Nadie pasa sin estar en la lista.

## Conceptos Clave

### 1. Perfiles (Profiles)

Cada usuario tiene un `profile_id`.

- `1` = Admin
- `2` = Público (Usuario no logueado)
- `3` = Cliente, etc.

### 2. Transacciones (`tx`)

Cada acción en el sistema tiene un número único.

- `101`: Iniciar Sesión
- `501`: Ver Reportes

### 3. Permisos (Permissions Matrix)

La tabla `security.permissions` cruza Perfiles con Transacciones.

| Profile     | Transaction (`tx`)   | ¿Permitido? |
| :---------- | :------------------- | :---------- |
| Admin (1)   | Ver Reportes (501)   | ✅ SÍ       |
| Público (2) | Ver Reportes (501)   | ❌ NO       |
| Público (2) | Iniciar Sesión (101) | ✅ SÍ       |

## Autenticación vs Autorización

- **Autenticación**: "¿Quién eres?". Se resuelve con Login (Email/Password) y Sesiones.
- **Autorización**: "¿Qué puedes hacer?". Se resuelve consultando la matriz de permisos descrita arriba.

## Cómo agregar permisos

Cuando creas una nueva funcionalidad (`tx: 999`), debes insertar una fila en la base de datos diciendo qué perfiles pueden usarla.
