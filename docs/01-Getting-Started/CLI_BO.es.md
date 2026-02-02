# CLI Deep Dive: Business Object Generator (`pnpm run bo`)

El generador de Business Objects es tu mejor amigo para no escribir "boilerplate" (código repetitivo).
Se encarga de crear la estructura estándar de **8 archivos** en segundos.

## Comando Principal

```bash
pnpm run bo [comando] [opciones]
```

### Menú Interactivo

Si ejecutas solo `pnpm run bo`, verás un menú interactivo:

```
📦 ToProccess BO CLI
══════════════════════════════════════════════════

? ¿Qué te gustaría hacer?
  1. 🆕 Crear nuevo Business Object
  2. 📋 Listar todos los BOs
  3. 🔄 Sincronizar métodos a la DB
  4. 🔐 Gestionar permisos
  5. 🔑 Generar preset de Auth
  6. 🔍 Health check de BOs
  7. 🚀 Wizard de configuración
  8. ❌ Salir
```

---

## Comandos Disponibles

| Comando                        | Descripción                                |
| ------------------------------ | ------------------------------------------ |
| `pnpm run bo new <Nombre>`     | Crea un nuevo Business Object (8 archivos) |
| `pnpm run bo list`             | Lista todos los BOs registrados            |
| `pnpm run bo sync [nombre]`    | Sincroniza métodos con la base de datos    |
| `pnpm run bo perms [nombre]`   | Gestiona permisos para un BO               |
| `pnpm run bo auth`             | Genera el módulo de autenticación          |
| `pnpm run bo analyze [nombre]` | Health check de BOs                        |
| `pnpm run bo init`             | Wizard de configuración inicial            |

---

## `pnpm run bo new <Nombre>`

Crea un nuevo Business Object con la estructura de 8 archivos.

### Opciones

| Flag        | Alias | Default                    | Descripción                         |
| ----------- | ----- | -------------------------- | ----------------------------------- |
| `--methods` | `-m`  | `get,create,update,delete` | Métodos a generar                   |
| `--dry`     | `-d`  | `false`                    | Muestra qué se crearía sin escribir |
| `--yes`     | `-y`  | `false`                    | Modo no interactivo                 |

### Ejemplos

```bash
# CRUD completo
pnpm run bo new Products

# Solo lectura
pnpm run bo new Reports --methods "list,search,export"

# Verificar antes de crear
pnpm run bo new Orders --dry
```

### Nomenclatura de Archivos

Los archivos siguen la convención `{Nombre}{Tipo}.ts`:

```
BO/Product/
├── 📦 ProductBO.ts            # Business Object (archivo principal)
├── 🧠 ProductService.ts       # Lógica de negocio
├── 🗄️ ProductRepository.ts    # Acceso a base de datos
├── 🔍 ProductQueries.ts       # SQL colocalizado
├── ✅ ProductSchemas.ts        # Validaciones Zod
├── 📘 ProductTypes.ts          # Interfaces TypeScript
├── 💬 ProductMessages.ts       # Strings i18n (ES/EN)
└── ❌ ProductErrors.ts         # Clases de error personalizadas
```

> [!NOTE]
> Esta nomenclatura facilita la organización y búsqueda de archivos en editores con soporte de fuzzy search.

---

## `pnpm run bo sync`

Sincroniza los métodos de tus BOs con la tabla `security.methods`.

```bash
# Sincronizar un BO específico
pnpm run bo sync Products

# Sincronizar todos los BOs
pnpm run bo sync --all

# Eliminar métodos que ya no existen en el código
pnpm run bo sync --all --prune
```

---

## `pnpm run bo perms`

Gestiona permisos de forma interactiva.

```bash
pnpm run bo perms Products
```

Muestra una matriz de permisos:

```
🔐 Gestión de Permisos para ProductsBO
──────────────────────────────────────────────────

┌──────────────┬──────────┬──────────┬──────────┐
│ Método       │ Admin    │ Public   │ Session  │
├──────────────┼──────────┼──────────┼──────────┤
│ get          │ ✅       │ ✅       │ ✅       │
│ create       │ ✅       │ ❌       │ ✅       │
│ update       │ ✅       │ ❌       │ ✅       │
│ delete       │ ✅       │ ❌       │ ❌       │
└──────────────┴──────────┴──────────┴──────────┘

💡 Opciones:
   1. Otorgar permiso
   2. Revocar permiso
   3. Aplicar plantilla
   4. Salir
```

### Plantillas de Permisos

1. **Lectura Pública, Escritura Privada**: Métodos de lectura públicos, escritura solo admin/session
2. **Solo Admin**: Todo solo para administradores
3. **Todo Autenticado**: Todo para perfiles con sesión
4. **Todo Público**: Sin restricciones

---

## `pnpm run bo auth`

Genera el módulo de autenticación completo con la estructura de 7 archivos.

```bash
pnpm run bo auth
```

Crea:

```
BO/Auth/
├── 📦 AuthBO.ts              # Business Object principal
├── 🧠 AuthService.ts         # Lógica de autenticación
├── 🗄️ AuthRepository.ts      # Acceso a DB
├── 🔍 AuthQueries.ts         # SQL colocalizado
├── ✅ AuthSchemas.ts          # Validaciones Zod
├── 📘 AuthTypes.ts            # Interfaces (User, Session, etc.)
├── 💬 AuthMessages.ts         # Mensajes i18n (ES/EN)
└── ❌ AuthErrors.ts           # Errores personalizados
```

---

## `pnpm run bo analyze`

Ejecuta un health check en tus Business Objects.

```bash
# Analizar todos los BOs
pnpm run bo analyze

# Analizar uno específico
pnpm run bo analyze Products
```

---

## `pnpm run bo init`

Wizard de configuración inicial para nuevos proyectos.

```bash
pnpm run bo init
```

Te guía paso a paso:

1. Crear tu primer BO
2. Configurar base de datos
3. Sincronizar métodos
4. Configurar permisos

---

## Snippets de VSCode

El proyecto incluye snippets para acelerar el desarrollo. Escribe el prefijo y presiona `Tab`:

### Snippets Disponibles

| Prefijo          | Descripción                            |
| ---------------- | -------------------------------------- |
| `tp-bo`          | Business Object completo con método    |
| `tp-bo-method`   | Agregar método transaccional a un BO   |
| `tp-service`     | Clase Service con repository y errors  |
| `tp-repo-method` | Método de acceso a base de datos       |
| `tp-schema`      | Schemas Zod con claves i18n            |
| `tp-types`       | Interfaces con secciones Entidad/Input |
| `tp-queries`     | Archivo de SQL colocalizado            |
| `tp-messages`    | Mensajes de éxito/error/validación     |
| `tp-errors`      | Clases de error personalizadas         |
| `tp-test`        | Suite de test con Node Test Runner     |
| `tp-log`         | Logging con el sistema de logger       |

### Uso

1. Crea un nuevo archivo en la carpeta de tu BO
2. Escribe el prefijo del snippet (ej: `tp-bo`)
3. Presiona `Tab` para expandir
4. Usa `Tab` para navegar entre los placeholders

### Ejemplo: `tp-messages`

```typescript
// Escribe: tp-messages + Tab

export const ProductMessages = {
    es: {
        createSuccess: 'Product creado exitosamente',
        updateSuccess: 'Product actualizado exitosamente',
        deleteSuccess: 'Product eliminado exitosamente',
        notFound: 'Product no encontrado',
    },
    en: {
        createSuccess: 'Product created successfully',
        updateSuccess: 'Product updated successfully',
        deleteSuccess: 'Product deleted successfully',
        notFound: 'Product not found',
    },
}
```

> [!TIP]
> Los snippets usan placeholders inteligentes. Al expandir, el cursor se posiciona en el nombre y al escribir se actualiza automáticamente en todos los lugares relevantes.

---

## Preguntas Frecuentes

### ¿Qué pasa si la carpeta ya existe?

El script pregunta si quieres sobrescribir con `--yes` o en modo interactivo.

### ¿Puedo editar las plantillas?

¡Sí! Las plantillas viven en `scripts/bo/templates/`.

### ¿Por qué 7 archivos?

La separación promueve:

1. **Testabilidad**: Cada capa se puede probar independientemente
2. **Mantenibilidad**: Código organizado y predecible
3. **Reusabilidad**: Messages y errors se pueden compartir
4. **Tipado**: Types centralizados evitan duplicación
5. **i18n**: Messages.ts facilita internacionalización bilingüe
6. **SQL**: Queries.ts mantiene SQL colocalizado y tipado
