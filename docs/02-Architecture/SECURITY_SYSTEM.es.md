# Sistema de Seguridad Unificado (Security System)

La seguridad en ToProccess es el cimiento de la arquitectura.
Se basa en un modelo **Transaction-Oriented** donde cada acción de negocio tiene un ID único, permisos granulares y una ejecución orquestada de forma segura.

## 1. Concepto: Transaction-Oriented Security

En lugar de exponer recursos CRUD tradicionales (`POST /users`), exponemos Intenciones de Negocio (`tx: 1001` -> "Registrar Usuario").

**Ventajas**:

1.  **Desacoplamiento**: El frontend no sabe que existe una clase `UserBO`. Solo conoce el ID `1001`.
2.  **Auditoría**: Es trivial saber quién ejecutó la transacción `1001` y cuándo.
3.  **Refactorización**: Puedes renombrar métodos sin romper clientes.
4.  **Deny by Default**: Si una transacción no tiene permiso explícito en la DB, nadie la puede ejecutar.

---

## 2. Nueva Arquitectura (Core Refactor)

Hemos separado las responsabilidades en componentes especializados para cumplir con **SOLID** y mejorar la seguridad:

### A. Matriz de Permisos (`security.permissions`)

Toda la autorización se basa en la base de datos, cargada en memoria RAM (`PermissionGuard`) para velocidad O(1).

| transaction_id (`tx`) | profile_id | descripcion          |
| :-------------------- | :--------- | :------------------- |
| 1001 (Register)       | 2 (Public) | Permitido a anónimos |
| 1002 (Admin Panel)    | 1 (Admin)  | Solo admins          |

### B. Componentes del Core (`src/core/*`)

1.  **TransactionOrchestrator** (El Director):
    - Recibe la petición del controlador.
    - Coordina: Resolución -> Validación Ruta -> AuthZ -> Ejecución -> Auditoría.
    - **Seguridad**: Valida nombres de métodos contra whitelist (Regex) para prevenir ejecución arbitraria.

2.  **AuthorizationService** (El Guardián):
    - Responsable único de decir SI/NO.
    - Consulta `PermissionGuard`.
    - Loguea intentos de acceso denegado.

3.  **TransactionExecutor** (El Ejecutor):
    - Carga dinámicamente el Business Object (BO).
    - **Seguridad Crítica**: Implementa **Path Containment**. Verifica que el archivo a cargar esté realmente dentro de `/BO` y no sea un path traversal (`../../etc/passwd`).
    - Inyecta dependencias (DB, Log, Validator, I18n).

4.  **TransactionMapper** (El Mapa):
    - Traduce `tx: 1001` -> `{ object: "Auth", method: "register" }`.

---

## 3. Flujo Seguro

1. **Resolución**: `TransactionMapper` encuentra la ruta.
2. **Validación de Ruta (Anti-Traversal)**: `TransactionOrchestrator` verifica caracteres ilegales.
3. **Autorización**: `AuthorizationService` verifica matriz de permisos.
4. **Ejecución Segura**: `TransactionExecutor` resuelve path absoluto, verifica contención en root y ejecuta.
5. **Auditoría**: Se registra éxito o error.

---

## 4. Perfiles Especiales

- **Perfil Público (ID Configurable)**:
    - Se usa automáticamente cuando un usuario no tiene sesión (cookie).
    - Define qué puede hacer un anónimo (Login, Registro, Recuperar Password).
- **Super Admin (ID 1)**:
    - Típicamente tiene acceso a todo, pero el sistema lo trata como un perfil más.
    - No hay "if (admin) bypass" hardcodeado en el código, todo está en la DB.

---

## 5. Capas Adicionales

1.  **CSRF (Cross-Site Request Forgery)**:
    - Token sincronizado en cookie y header.
2.  **Rate Limiting**:
    - Estrategias estrictas para endpoints sensibles (`/login`).
