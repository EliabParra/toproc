# CLI Deep Dive: Business Object Generator (`npm run bo`)

El generador de Business Objects es tu mejor amigo para no escribir "boilerplate" (código repetitivo).
Se encarga de crear la estructura estándar de 4 capas en segundos.

## Comando Principal

```bash
npm run bo new <NombreEntidad> [opciones]
```

### Argumentos

| Argumento       | Requerido | Descripción                                                        |
| :-------------- | :-------- | :----------------------------------------------------------------- |
| `NombreEntidad` | Sí        | El nombre del módulo (PascalCase). Ej: `Products`, `UserInvoices`. |

### Opciones (Flags)

| Flag        | Alias | Default                    | Descripción                                                |
| :---------- | :---- | :------------------------- | :--------------------------------------------------------- |
| `--methods` | `-m`  | `get,create,update,delete` | Lista separada por comas de métodos a generar en el BO.    |
| `--dry-run` | `-d`  | `false`                    | Muestra qué archivos se crearían sin escribirlos en disco. |

---

## Ejemplos de Uso

### 1. El Básico (CRUD Completo)

Crea un módulo con `get`, `create`, `update`, `delete`.

```bash
npm run bo new Tickets
```

**Resultado en disco (`src/BO/Tickets/`)**:

- `TicketsBO.ts`: Controlador con los 4 métodos.
- `TicketsService.ts`: Lógica vacía lista para llenar.
- `TicketsRepository.ts`: Queries SQL placeholder.
- `schemas.ts`: Schemas Zod básicos para los 4 métodos.

### 2. Personalizado (Solo Lectura)

Si estás creando un reporte que solo lee datos, no necesitas `create` ni `delete`.

```bash
npm run bo new DailyReports --methods "search,exportPDF"
```

**Resultado**:
El `DailyReportsBO.ts` tendrá solo `search` y `exportPDF`. Esto mantiene el código limpio desde el día 1.

### 3. Prueba Segura (Dry Run)

¿No estás seguro de qué va a pasar? Úsalo antes de ensuciar tu proyecto.

```bash
npm run bo new ComplexModule --dry-run
```

**Salida**:

```text
[DRY] would create /path/to/project/BO/ComplexModule
[DRY] Would write to .../ComplexModuleBO.ts
...
```

---

## Preguntas Frecuentes

### ¿Qué pasa si la carpeta ya existe?

El script fallará para protegerte de sobrescribir trabajo existente.
**Solución**: Borra la carpeta manualmente o usa otro nombre.

### ¿Puedo editar las plantillas?

¡Sí! Las plantillas viven en `scripts/bo/templates/`.
Si tu equipo decide que todos los BOs deben tener un método `audit()`, edita la plantilla `bo.ts` ahí y todos los futuros BOs lo tendrán.

### ¿Por qué crea 4 archivos?

Es la arquitectura del framework:

1.  **BO**: Interface pública.
2.  **Service**: Cerebro.
3.  **Repository**: Músculo (DB).
4.  **Schema**: Validación.
    Tenerlos separados desde el principio evita que termines con un archivo de 2000 líneas.
