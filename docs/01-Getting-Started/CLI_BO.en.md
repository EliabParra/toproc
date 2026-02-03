# CLI Deep Dive: Business Object Generator (`pnpm run bo`)

The Business Object generator is your best friend for avoiding boilerplate code.
It creates the standard **9-file structure** in seconds.

## Main Command

```bash
pnpm run bo [command] [options]
```

### Interactive Menu

Running just `pnpm run bo` shows an interactive menu:

```
📦 ToProccess BO CLI
══════════════════════════════════════════════════

? What would you like to do?
  1. 🆕 Create new Business Object
  2. 📋 List all BOs
  3. 🔄 Sync BO methods to DB
  4. 🔐 Manage permissions
  5. 🔑 Generate Auth preset
  6. 🔍 BO health check
  7. 🚀 Setup wizard
  8. ❌ Exit
```

---

## Available Commands

| Command                      | Description                            |
| ---------------------------- | -------------------------------------- |
| `pnpm run bo new <Name>`     | Create a new Business Object (9 files) |
| `pnpm run bo list`           | List all registered BOs                |
| `pnpm run bo sync [name]`    | Sync methods with database             |
| `pnpm run bo perms [name]`   | Manage permissions for a BO            |
| `pnpm run bo auth`           | Generate authentication module         |
| `pnpm run bo analyze [name]` | BO health check                        |
| `pnpm run bo init`           | Project setup wizard                   |

---

## `pnpm run bo new <Name>`

Creates a new Business Object with the 9-file structure.

### Options

| Flag        | Alias | Default                    | Description                                |
| ----------- | ----- | -------------------------- | ------------------------------------------ |
| `--methods` | `-m`  | `get,create,update,delete` | Methods to generate                        |
| `--dry`     | `-d`  | `false`                    | Show what would be created without writing |
| `--yes`     | `-y`  | `false`                    | Non-interactive mode                       |

### Examples

```bash
# Full CRUD
pnpm run bo new Products

# Read-only
pnpm run bo new Reports --methods "list,search,export"

# Verify before creating
pnpm run bo new Orders --dry
```

### File Naming Convention

Files follow the `{Name}{Type}.ts` convention:

```
BO/Product/
├── 📦 ProductBO.ts            # Business Object (main file)
├── 🧠 ProductService.ts       # Business logic
├── 🗄️ ProductRepository.ts    # Database access
├── 🔍 ProductQueries.ts       # Colocated SQL
├── ✅ ProductSchemas.ts        # Zod validations
├── 📘 ProductTypes.ts          # TypeScript interfaces
├── 💬 ProductMessages.ts       # i18n strings (ES/EN)
├── ❌ ProductErrors.ts         # Custom error classes
└── 📦 ProductModule.ts         # Module barrel exports
```

> [!NOTE]
> This naming convention makes it easy to find files in editors with fuzzy search support.

---

## `pnpm run bo sync`

Synchronizes your BO methods with the `security.methods` table.

```bash
# Sync a specific BO
pnpm run bo sync Products

# Sync all BOs
pnpm run bo sync --all

# Remove methods that no longer exist in code
pnpm run bo sync --all --prune
```

---

## `pnpm run bo perms`

Manage permissions interactively.

```bash
pnpm run bo perms Products
```

Shows a permission matrix:

```
🔐 Permission Manager for ProductsBO
──────────────────────────────────────────────────

┌──────────────┬──────────┬──────────┬──────────┐
│ Method       │ Admin    │ Public   │ Session  │
├──────────────┼──────────┼──────────┼──────────┤
│ get          │ ✅       │ ✅       │ ✅       │
│ create       │ ✅       │ ❌       │ ✅       │
│ update       │ ✅       │ ❌       │ ✅       │
│ delete       │ ✅       │ ❌       │ ❌       │
└──────────────┴──────────┴──────────┴──────────┘

💡 Options:
   1. Grant permission
   2. Revoke permission
   3. Apply template
   4. Exit
```

### Permission Templates

1. **Public Read, Private Write**: Read methods public, write methods admin/session only
2. **Admin Only**: Everything restricted to administrators
3. **All Authenticated**: Everything for logged-in users
4. **All Public**: No restrictions

---

## `pnpm run bo auth`

Generates the complete authentication module with the 9-file structure.

```bash
pnpm run bo auth
```

Creates:

```
BO/Auth/
├── 📦 AuthBO.ts              # Main Business Object
├── 🧠 AuthService.ts         # Auth logic
├── 🗄️ AuthRepository.ts      # DB access
├── 🔍 AuthQueries.ts         # Colocated SQL
├── ✅ AuthSchemas.ts          # Zod validations
├── 📘 AuthTypes.ts            # Interfaces (User, Session, etc.)
├── 💬 AuthMessages.ts         # i18n messages (ES/EN)
└── ❌ AuthErrors.ts           # Custom errors
```

---

## `pnpm run bo analyze`

Runs a health check on your Business Objects.

```bash
# Analyze all BOs
pnpm run bo analyze

# Analyze a specific one
pnpm run bo analyze Products
```

---

## `pnpm run bo init`

Project setup wizard for new projects.

```bash
pnpm run bo init
```

Guides you through:

1. Creating your first BO
2. Database configuration
3. Syncing methods
4. Configuring permissions

---

## VSCode Snippets

The project includes snippets to speed up development. Type the prefix and press `Tab`:

### Available Snippets

| Prefix           | Description                              |
| ---------------- | ---------------------------------------- |
| `tp-bo`          | Complete Business Object with method     |
| `tp-bo-method`   | Add transactional method to a BO         |
| `tp-service`     | Service class with repository and errors |
| `tp-repo-method` | Database access method                   |
| `tp-schema`      | Zod schemas with i18n keys               |
| `tp-types`       | Interfaces with Entity/Input sections    |
| `tp-queries`     | Colocated SQL file                       |
| `tp-messages`    | Success/error/validation messages        |
| `tp-errors`      | Custom error classes                     |
| `tp-test`        | Test suite with Node Test Runner         |
| `tp-log`         | Logging with the logger system           |

### Usage

1. Create a new file in your BO folder
2. Type the snippet prefix (e.g., `tp-bo`)
3. Press `Tab` to expand
4. Use `Tab` to navigate between placeholders

### Example: `tp-messages`

```typescript
// Type: tp-messages + Tab

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
> Snippets use smart placeholders. When expanded, the cursor is positioned on the name and typing updates it automatically in all relevant places.

---

## FAQ

### What happens if the folder already exists?

The script asks if you want to overwrite with `--yes` or in interactive mode.

### Can I edit the templates?

Yes! Templates live in `scripts/bo/templates/`.

### Why 9 files?

The separation promotes:

1. **Testability**: Each layer can be tested independently
2. **Maintainability**: Organized and predictable code
3. **Reusability**: Messages and errors can be shared
4. **Typing**: Centralized types avoid duplication
5. **i18n**: Messages.ts facilitates bilingual internationalization
6. **SQL**: Queries.ts keeps SQL colocated and typed
7. **DX**: Module.ts reduces imports with a single barrel
