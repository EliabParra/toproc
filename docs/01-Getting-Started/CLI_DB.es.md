# CLI Deep Dive: Database CLI (`pnpm run db`)

El CLI unificado de base de datos es la herramienta central para gestionar tu esquema PostgreSQL, sincronizar Business Objects, y mantener la base de datos en sincronía con el equipo.

## Inicio Rápido

```bash
# Modo interactivo (menú)
pnpm run db

# Aplicar esquemas (Code → DB)
pnpm run db sync

# Ver ayuda completa
pnpm run db -- --help
```

> **Nota:** Si usas `pnpm`, ejecuta `pnpm run db ...`.

---

## Acciones Disponibles

| Acción       | Comando                  | Descripción                                   |
| :----------- | :----------------------- | :-------------------------------------------- |
| `sync`       | `pnpm run db sync`       | Aplica esquemas del código a la BD            |
| `introspect` | `pnpm run db introspect` | Genera esquemas desde la BD existente         |
| `seed`       | `pnpm run db seed`       | Crea perfiles, admin y registra BOs           |
| `bo`         | `pnpm run db bo`         | Sincroniza métodos de BOs (detecta huérfanos) |
| `reset`      | `pnpm run db reset`      | ⚠️ Elimina y recrea todas las tablas          |
| `print`      | `pnpm run db print`      | Muestra SQL sin ejecutar                      |

---

## Arquitectura del CLI

```
scripts/db/
├── index.ts           # Punto de entrada principal
├── cli/
│   └── parser.ts      # Parser de argumentos
├── core/
│   ├── introspector.ts    # DB → Code (Introspección)
│   └── MigrationRunner.ts # Code → DB (Sincronización)
├── schemas/           # 📁 ESQUEMAS (Fuente de la Verdad)
│   ├── 01_base.ts     # Tablas del sistema (Manual)
│   ├── 10_users.ts    # Extensiones de usuarios (Manual)
│   ├── 80_auto_x.ts   # Auto-generados (Introspect)
│   └── 90_audit.ts    # Mantenimiento (Manual)
└── seeders/           # Lógica de población de datos
```

---

## Sync: Código → Base de Datos

### Cómo Funciona

1. El CLI lee todos los archivos `.ts` en `scripts/db/schemas/`
2. Los ordena numéricamente.
3. Ejecuta cada sentencia SQL en orden idempotente.

### Estándar de Nombres (Naming Convention)

Para mantener el orden, usamos prefijos numéricos estrictos:

| Rango   | Uso                                        | Modificable |
| :------ | :----------------------------------------- | :---------- |
| `00-09` | **Core del Sistema** (Perfiles, Seguridad) | Manual      |
| `10-19` | **Extensiones Core** (Usuarios extendidos) | Manual      |
| `20-49` | **Módulos de Negocio** (Productos, Auth)   | Manual      |
| `50-79` | **Lógica de Negocio Custom**               | Manual      |
| `80-89` | **Auto-Generados** (Introspect)            | **Auto**    |
| `90-99` | **Mantenimiento / Auditoría**              | Manual      |

> ⚠️ Los archivos en `80-89` serán **SOBRESCRITOS** por el comando `introspect` si la tabla cambia. Los demás son protegidos.

---

## Introspect: Base de Datos → Código

Genera esquemas TypeScript desde tablas existentes.

```bash
pnpm run db introspect
```

### Opciones Nuevas

#### Incluir Datos e Índices

Puedes exportar también los **datos** de una tabla (útil para catálogos o configuraciones) y sus índices:

```bash
pnpm run db introspect -- --data
# O en modo interactivo, responde "y" cuando te pregunte.
```

Esto generará archivos que incluyen:

1. `CREATE TABLE`
2. `INSERT INTO ...` (Datos)
3. `CREATE INDEX ...`

### Comportamiento Inteligente

- **Protección**: Si tienes una tabla definida manualmente (ej. en `01_base.ts`), la introspección **la saltará** para no borrar tu código.
- **Actualización**: Si la tabla está en un archivo generado (ej. `80_public_config.ts`), actualizará el archivo con los nuevos cambios de estructura o datos.

---

## Seed: Datos Iniciales

### Perfiles del Sistema

```bash
pnpm run db seed --seedProfiles
```

Crea los perfiles mínimos:

- `profile_id=1`: Admin (acceso total)
- `profile_id=2`: Público (acceso anónimo)
- `profile_id=3`: Sesión (usuarios autenticados)

### Usuario Administrador

```bash
pnpm run db seed --seedAdmin
```

Opciones:

- `--adminUser <nombre>`: Username (default: `admin`)
- `--adminPassword <pw>`: Password (auto-genera si no se especifica)
- `--profileId <id>`: Perfil a asignar (default: 1)

### Registro de BOs

```bash
pnpm run db seed --registerBo
```

Descubre automáticamente los BOs en `BO/` y registra sus métodos en `security.methods`.

---

## BO Sync: Sincronización Bidireccional

La funcionalidad más poderosa para equipos.

### Registrar Nuevos Métodos

```bash
pnpm run db bo
```

1. Escanea `BO/*/BO.ts` buscando métodos `async`
2. Registra cada método en `security.methods`
3. Asigna números `tx` automáticamente
4. Otorga permisos al perfil especificado

### Detectar Métodos Huérfanos

Si alguien eliminó un método del código pero sigue en la BD:

```bash
pnpm run db bo
# ⚠️ Found 2 orphaned methods (in DB but not in code):
#    • OldBO.deletedMethod (tx: 50)
#    • OldBO.anotherDeleted (tx: 51)
```

### Limpiar Huérfanos

```bash
pnpm run db bo --prune
```

Esto elimina:

1. Los permisos asociados (`security.permission_methods`)
2. Los registros de métodos (`security.methods`)

### Modo Dry-Run (Recomendado primero)

```bash
pnpm run db bo --prune --dry-run
```

Muestra qué haría sin ejecutar cambios.

---

## Reset: Empezar de Cero

⚠️ **PELIGROSO** - Elimina TODOS los datos.

```bash
pnpm run db reset
```

En modo interactivo, pide confirmación. Para CI/CD:

```bash
pnpm run db reset --yes
```

Después del reset, automáticamente re-aplica los esquemas.

---

## Opciones Globales

| Flag               | Descripción                       |
| :----------------- | :-------------------------------- |
| `--yes`, `-y`      | Modo no-interactivo (acepta todo) |
| `--dry-run`        | Simula sin ejecutar               |
| `--profile <name>` | Perfil de entorno (dev/prod/test) |
| `--silent`         | Suprime output                    |

### Conexión a Base de Datos

| Flag                | Descripción            |
| :------------------ | :--------------------- |
| `--host <host>`     | Host de PostgreSQL     |
| `--port <port>`     | Puerto (default: 5432) |
| `--user <user>`     | Usuario                |
| `--password <pw>`   | Contraseña             |
| `--database <name>` | Nombre de la BD        |
| `--ssl`             | Habilitar SSL          |

### Variables de Entorno

El CLI respeta las variables estándar de PostgreSQL:

```bash
PGHOST=localhost
PGPORT=5432
PGDATABASE=toproc
PGUSER=postgres
PGPASSWORD=secret
```

---

## Resolución de Problemas

### "Connection Refused"

```
🔥 Fatal Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Causas:**

- PostgreSQL no está corriendo
- Puerto incorrecto

**Solución:**

```bash
# Verificar servicio
docker-compose ps  # o systemctl status postgresql
```

### "Authentication Failed"

```
🔥 Fatal Error: password authentication failed
```

**Solución:**

- Verifica `PGPASSWORD` en `.env`
- Confirma usuario/password en pgAdmin

### "Database Does Not Exist"

```
🔥 Fatal Error: database "toproc" does not exist
```

**Solución:**

```sql
CREATE DATABASE toproc;
```

---

## Ejemplos de Flujo Completo

### Setup Inicial de Proyecto

```bash
# 1. Configurar conexión
cp .env.example .env
# (editar .env con credenciales)

# 2. Crear esquema base
pnpm run db sync

# 3. Crear perfiles y admin
pnpm run db seed --seedProfiles --seedAdmin

# 4. Registrar BOs existentes
pnpm run db bo
```

### Después de git pull

```bash
git pull origin main
pnpm run db sync         # Aplica nuevos esquemas
pnpm run db bo           # Registra nuevos métodos
```

### Antes de hacer commit

```bash
pnpm run db bo --dry-run  # Verificar estado
pnpm run verify           # Quality gate
```

---

## Archivos Clave

| Archivo                    | Propósito                  |
| -------------------------- | -------------------------- |
| `scripts/db/schemas/*.ts`  | Tus definiciones de tablas |
| `scripts/db/core/db.ts`    | Clase de conexión          |
| `scripts/db/cli/parser.ts` | Parser de argumentos       |

---

## Ver También

- [Flujo de Trabajo Colaborativo](../05-Guides/COLLABORATIVE_WORKFLOW.es.md)
- [Generador de BOs](CLI_BO.es.md)
- [Modelo de Seguridad](../02-Architecture/SECURITY_SYSTEM.es.md)
