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

- **AppServer**: El cerebro que conecta Controladores.
- **HTTP**: Servidor Express, middlewares y rutas (`src/api/http`).

#### `src/config/`

- Maneja la carga de variables de entorno `.env`.
- Valida que no falten claves secretas al iniciar.

#### `src/core/` (La zona sagrada)

Aquí están las clases base que extienden los BOs.

- `business-objects/`: `BaseBO`, `CrudBO`, `BOService`, `BOError`.

#### `src/services/` (Infraestructura y Utilidades)

Capa consolidada para todos los servicios técnicos (Base de datos, Email, Logging, etc.).

- `DatabaseService`: Abstracción de PostgreSQL.
- `EmailService`: Envío de correos (SMTP/Log).
- `SecurityService`: Lógica de autenticación y autorización.
- `SessionService`: Gestión de sesiones de usuario.
- `LoggerService`: Logging estructurado.
- `I18nService`: Internacionalización.

#### `src/types/`

- Archivos `.d.ts` y definiciones de TypeScript globales.

---

## Archivos en Raíz

- **`.env.example`**: Plantilla de variables de entorno.
- **`package.json`**: Lista de dependencias y scripts (`pnpm run ...`).
- **`tsconfig.json`**: Reglas del compilador TypeScript (e.g., Modo Estricto activado).
