# Sistema de Seguridad Unificado (Security System)

La seguridad en ToProccess es el cimiento de la arquitectura.
Se basa en un modelo **Transaction-Oriented** donde cada acción de negocio tiene un ID único y permisos granulares.

## 1. Concepto: Transaction-Oriented Security

En lugar de exponer recursos CRUD tradicionales (`POST /users`), exponemos Intenciones de Negocio (`tx: 1001` -> "Registrar Usuario").

**Ventajas**:

1.  **Desacoplamiento**: El frontend no sabe que existe una clase `UserBO`. Solo conoce el ID `1001`.
2.  **Auditoría**: Es trivial saber quién ejecutó la transacción `1001` y cuándo.
3.  **Refactorización**: Puedes renombrar métodos sin romper clientes.
4.  **Deny by Default**: Si una transacción no tiene permiso explícito en la DB, nadie la puede ejecutar.

---

## 2. Componentes Clave

### A. Matriz de Permisos (DB -> RAM)

Toda la autorización se basa en la tabla `security.permissions`.

| transaction_id (`tx`) | profile_id | descripcion          |
| :-------------------- | :--------- | :------------------- |
| 1001 (Register)       | 2 (Public) | Permitido a anónimos |
| 1002 (Admin Panel)    | 1 (Admin)  | Solo admins          |

**PermissionGuard (`PermissionGuard.ts`)**:
Carga esta tabla completa en memoria RAM al iniciar el servidor (Map de búsqueda O(1)).

- **Velocidad**: Verificar permiso toma nanosegundos.
- **Consistencia**: No hay SQL queries por cada petición para verificar auth.

### B. Transaction Mapper (`TransactionMapper.ts`)

Es el diccionario que traduce números a código.

```json
// security.transactions
{
    "1001": { "object": "Auth", "method": "register" },
    "1002": { "object": "Dashboard", "method": "getData" }
}
```

### C. SecurityService (El Guardián)

Es el servicio que orquesta todo.

1. Recibe `tx: 1001`.
2. Llama a Mapper -> `Auth.register`.
3. Llama a Guard -> `¿Perfil X tiene permiso para Auth.register?`.
4. Si SI -> Ejecuta el BO.
5. Si NO -> Loguea incidente y devuelve 403.

---

## 3. Perfiles Especiales

- **Perfil Público (ID Configurable)**:
    - Se usa automáticamente cuando un usuario no tiene sesión (cookie).
    - Define qué puede hacer un anónimo (Login, Registro, Recuperar Password).
- **Super Admin (ID 1)**:
    - Típicamente tiene acceso a todo, pero el sistema lo trata como un perfil más.
    - No hay "if (admin) bypass" hardcodeado en el código, todo está en la DB.

---

## 4. Capas Adicionales

1.  **CSRF (Cross-Site Request Forgery)**:
    - Token sincronizado en cookie y header.
    - Previene que otros sitios ejecuten `tx` en nombre del usuario.
2.  **Rate Limiting**:
    - `LoginRateLimiter`: 5 intentos/minuto (Estricto).
    - `AppRateLimiter`: 100 peticiones/minuto (Laxo).
