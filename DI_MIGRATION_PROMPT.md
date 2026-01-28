# Prompt Maestro: Migración a Arquitectura Clean DI & Limpieza Profunda

**Instrucción Crítica:** Copia y pega el siguiente prompt en una nueva sesión. Es la única guía válida.

---

**Rol:** Eres un **Arquitecto de Software Senior y Lead Developer (Tech Lead)**. Tu misión es transformar la base de código actual hacia una arquitectura de **Pure Dependency Injection (DI)** intachable.

**Tus Instrucciones son Sagradas:**

1.  **Cero Tolerancia a Deuda Técnica:** Elimina sin piedad código muerto, duplicado o "legacy".
2.  **Explicit Over Implicit:** Nada de variables globales ocultas. Todo se pasa en el constructor.
3.  **Unificación de Verdades:** Solo debe haber una definición de tipos en `src/types`. Nada de `src/core/interfaces` duplicados.
4.  **Workflow de Aprobación ESTRICTO:** Al terminar CADA Fase, ejecutas los tests, te detienes y me pides aprobación explícita. "Esperando aprobación para Commit y Fase [X]".

---

## Plan Maestro de Ejecución

### FASE 0: Auditoría y Destrucción (The Purge)

**Objetivo:** Limpiar el terreno. No dejar supervivientes del código viejo.

1.  **Eliminación Directa:** Ejecuta los comandos para borrar estos archivos/directorios específicos:
    - `scripts/bo/legacy/` (Directorio completo).
    - `src/core/validation/integration/LegacyValidatorAdapter.ts` (Archivo).
    - `src/globals.ts` (Archivo - sus exportaciones deben moverse a inyección explícita si se usan, o eliminarse).
2.  **Consolidación de Tipos:**
    - Mover cualquier definición útil de `src/core/interfaces/services.ts` a `src/types/core.ts` (solo si no existe ya).
    - **Borrar** el directorio `src/core/interfaces` completo. Ya no lo queremos.
3.  **Búsqueda Exhaustiva:** Busca en todo `src` la cadena "Legacy" (case insensitive) y borra o refactoriza esos archivos.

**Gate de Salida FASE 0:**

- Ejecutar: `npm run typecheck`.
- Reportar: Archivos borrados.
- **Acción:** Esperar Aprobación.

### FASE 1: El Motor de Inyección (Infrastructure Core)

**Objetivo:** El `TransactionExecutor` debe ser el único lugar que instancia BOs, con **todas** las dependencias.

1.  **Refactorizar `src/core/transaction/TransactionExecutor.ts`**:
    - El constructor DEBE recibir `BODependencies` completo (db, log, config, v, i18n, email).
    - Método `execute`: Al instanciar `new BO(...)`, pasar `this.dependencies`.
    - Eliminar cualquier lógica de `import` condicional complicada si no es vital.
2.  **Refactorizar `src/core/security/SecurityService.ts`**:
    - Constructor debe recibir TODO lo necesario para crear `BODependencies`.
    - Debe instanciar `TransactionExecutor` pasando el objeto `deps` completo.
3.  **Refactorizar `src/api/dispatcher/Dispatcher.ts`**:
    - Es el "Composition Root" de la API. Debe inyectar todo al `SecurityService`.
4.  **Limpieza de `src/index.ts`**:
    - Eliminar `(globalThis as any).security = security`.
    - Eliminar cualquier asignación a `globalThis`.

**Gate de Salida FASE 1:**

- Ejecutar: `npm run typecheck` (Debe pasar con 0 errores de tipos).
- **Acción:** Esperar Aprobación.

### FASE 2: Capa de Datos (Repositories)

**Objetivo:** Muerte a los métodos estáticos. Vida a la Inyección de DB.

1.  **Identificar:** Buscar todas las clases en `BO/` que terminen en `Repository.ts` (e.g. `Auth.Repository.ts`).
2.  **Transformación Masiva (Archivo por Archivo):**
    - **Constructor:** Agregar `constructor(private readonly db: IDatabase) {}`.
    - **Métodos:** Quitar `static`.
    - **Queries:** Cambiar `await db.exe(...)` (global implícito) por `await this.db.exe(...)`.
3.  **Verificación:** Buscar en el archivo transformado el string `static async` (no debe existir para queries) y `globalThis` (no debe existir).

**Gate de Salida FASE 2:**

- Ejecutar: `npm run typecheck` (Fallará en los Services, es normal, pero verifica que los Repos compile).
- **Acción:** Esperar Aprobación.

### FASE 3: Capa de Negocio (Services)

**Objetivo:** Inyectar Repositorios.

1.  **Refactorizar Services (e.g. `Auth.Service.ts`):**
    - Constructor: Recibir `repo: AuthRepository` (inyectado, no importado estáticamente).
    - Uso: `this.repo.getUser(...)`.
2.  **Eliminar:** Cualquier importación de la clase estática del Repositorio.

**Gate de Salida FASE 3:**

- Ejecutar: `npm run typecheck` (Fallará en BOs, normal).
- **Acción:** Esperar Aprobación.

### FASE 4: Capa de Controladores (BOs - The Grand Wiring)

**Objetivo:** Conectar todo manualmente en el BO.

1.  **Refactorizar BOs (e.g. `AuthBO.ts`):**
    - Eliminar fallback a `globalThis` en el constructor.
    - Constructor `(deps: BODependencies)` limpio.
    - **Wiring:**
        ```typescript
        const repo = new AuthRepository(deps.db)
        this.service = new AuthService(repo, deps.log, deps.config)
        ```

**Gate de Salida FASE 4:**

- Ejecutar: `npm run verify` (Debe pasar TODO: typecheck, build, test).
- **Acción:** COMMIT FINAL.

---

**Comienza AHORA con la FASE 0.** Analiza y borra lo que tengas que borrar.
