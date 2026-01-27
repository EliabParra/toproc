# CLI Deep Dive: Business Object Generator (`npm run bo`)

The Business Object generator is your best friend for avoiding boilerplate code.
It creates the standard **7-file structure** in seconds.

## Main Command

```bash
npm run bo [command] [options]
```

### Interactive Menu

Running just `npm run bo` shows an interactive menu:

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

| Command                     | Description                            |
| --------------------------- | -------------------------------------- |
| `npm run bo new <Name>`     | Create a new Business Object (7 files) |
| `npm run bo list`           | List all registered BOs                |
| `npm run bo sync [name]`    | Sync methods with database             |
| `npm run bo perms [name]`   | Manage permissions for a BO            |
| `npm run bo auth`           | Generate authentication module         |
| `npm run bo analyze [name]` | BO health check                        |
| `npm run bo init`           | Project setup wizard                   |

---

## `npm run bo new <Name>`

Creates a new Business Object with the 7-file structure.

### Options

| Flag        | Alias | Default                    | Description                                |
| ----------- | ----- | -------------------------- | ------------------------------------------ |
| `--methods` | `-m`  | `get,create,update,delete` | Methods to generate                        |
| `--dry`     | `-d`  | `false`                    | Show what would be created without writing |
| `--yes`     | `-y`  | `false`                    | Non-interactive mode                       |

### Examples

```bash
# Full CRUD
npm run bo new Products

# Read-only
npm run bo new Reports --methods "list,search,export"

# Verify before creating
npm run bo new Orders --dry
```

### File Naming Convention

Files follow the `{Name}.{Type}.ts` convention:

```
BO/Product/
├── 📦 ProductBO.ts            # Business Object (main file)
├── 🧠 Product.Service.ts      # Business logic
├── 🗄️ Product.Repository.ts   # Database access
├── ✅ Product.Schemas.ts       # Zod validations
├── 📘 Product.Types.ts         # TypeScript interfaces
├── 💬 Product.Messages.ts      # User-facing strings
└── ❌ Product.Errors.ts        # Custom error classes
```

> [!NOTE]
> This naming convention makes it easy to find files in editors with fuzzy search support.

---

## `npm run bo sync`

Synchronizes your BO methods with the `security.methods` table.

```bash
# Sync a specific BO
npm run bo sync Products

# Sync all BOs
npm run bo sync --all

# Remove methods that no longer exist in code
npm run bo sync --all --prune
```

---

## `npm run bo perms`

Manage permissions interactively.

```bash
npm run bo perms Products
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

## `npm run bo auth`

Generates the complete authentication module with the 7-file structure.

```bash
npm run bo auth
```

Creates:

```
BO/Auth/
├── 📦 AuthBO.ts              # Main Business Object
├── 🧠 Auth.Service.ts        # Auth logic
├── 🗄️ Auth.Repository.ts     # DB access
├── ✅ Auth.Schemas.ts         # Zod validations
├── 📘 Auth.Types.ts           # Interfaces (User, Session, etc.)
├── 💬 Auth.Messages.ts        # User-facing messages
├── ❌ Auth.Errors.ts          # Custom errors
└── 🔜 Auth.SocialAuth.ts     # OAuth (coming soon)
```

---

## `npm run bo analyze`

Runs a health check on your Business Objects.

```bash
# Analyze all BOs
npm run bo analyze

# Analyze a specific one
npm run bo analyze Products
```

---

## `npm run bo init`

Project setup wizard for new projects.

```bash
npm run bo init
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
| `tp-schema`      | Zod schemas with messages integration    |
| `tp-types`       | TypeScript interfaces for entities       |
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
    GET: 'Product found',
    CREATE: 'Product created successfully',
    UPDATE: 'Product updated successfully',
    DELETE: 'Product deleted successfully',
    NOT_FOUND: 'Product not found',
    // ...
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

### Why 7 files?

The separation promotes:

1. **Testability**: Each layer can be tested independently
2. **Maintainability**: Organized and predictable code
3. **Reusability**: Messages and errors can be shared
4. **Typing**: Centralized types avoid duplication
5. **i18n**: Messages.ts facilitates internationalization
