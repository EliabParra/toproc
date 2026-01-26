# Estructura de Proyecto Detallada (Detailed File Structure)

A diferencia de muchos proyectos que esconden su complejidad, ToProccess prefiere una estructura explícita. Cada carpeta tiene un propósito único.

## Referencia Visual Rápida

```text
/
├── BO/                      [BUSINESS OBJECTS] -> Lógica de Negocio
├── docs/                    [DOCUMENTACIÓN] -> Manuales
├── scripts/                 [SCRIPTS] -> Tareas automatizadas
├── src/                     [CÓDIGO FUENTE] -> Core del Framework
├── test/                    [TESTS] -> Pruebas
└── ... (archivos raíz)
```

---

## Profundización por Directorio

### 1. `BO/` (Business Objects)

**Para qué sirve**: Es el único lugar donde vivirán las reglas de tu negocio. Si vendes zapatos, aquí habrá una carpeta `Shoes`.
**Contenido**:

- `XBO.ts`: El controlador que recibe peticiones.
- `XService.ts`: La lógica pura.
- `XSchema.ts`: Validaciones Zod.
- `XRepository.ts`: SQL queries.

> **Regla de Oro**: Si borras la carpeta `BO/`, el sistema debería arrancar perfectamente (aunque sin hacer nada útil). Esto demuestra que el negocio está desacoplado del framework.

### 2. `docs/`

**Para qué sirve**: Documentación viva del proyecto.
**Estructura**:

- `00-Introduction`: Filosofía.
- `01-Getting-Started`: Guías de inicio.
- ... etc.
    > **Nota**: Generamos la documentación de API (TypeDoc) dentro de `docs/api`.

### 3. `src/` (Source)

El motor del framework. Se divide en áreas muy específicas:

#### `src/api/`

- **Dispatcher**: El cerebro que decide qué BO ejecutar.
- **Routes**: Definición de rutas Express (aunque principalmente usamos una sola ruta `/toProccess`).

#### `src/config/`

- Maneja la carga de variables de entorno `.env`.
- Valida que no falten claves secretas al iniciar.

#### `src/core/` (La zona sagrada)

Aquí están las clases base que extienden los BOs.

- `BaseBO`: Clase padre con métodos `ok()`, `error()`, `validate()`.
- `Transaction`: Interfaces para el sistema transaccional.
- `Security`: `SecurityService` y guards.

#### `src/db/`

- Abstracción de base de datos (PostgreSQL).
- Manejo del `Pool` de conexiones.
- Helper `QueryExec` para facilitar consultas.

#### `src/express/`

- Configuración del servidor HTTP.
- **Middlewares**:
    - `SecurityMiddleware`: Verifica tokens.
    - `RequestLogger`: Loguea cada petición.
    - `Helmet/Cors`: Seguridad HTTP estándar.

#### `src/infra/`

Servicios que conectan con "el mundo exterior".

- `EmailService`: Envío de correos (SMTP/Log).
- `AuditService`: Registro de eventos en DB.

#### `src/i18n/`

- Archivos JSON con traducciones (`es.json`, `en.json`).
- Servicio de carga de locales.

#### `src/logger/`

- Configuración de Winston/Pino (el logger que usemos).
- Rotación de logs.

#### `src/session/`

- Gestión de estado de usuarios (Redis/DB).
- Serialización de sesiones.

#### `src/types/`

- Archivos `.d.ts` y definiciones de TypeScript globales para que el compilador no se queje.

---

## Archivos en Raíz

- **`.env.example`**: Plantilla de variables de entorno.
- **`package.json`**: Lista de dependencias y scripts (`npm run ...`).
- **`tsconfig.json`**: Reglas del compilador TypeScript (e.g., Modo Estricto activado).
