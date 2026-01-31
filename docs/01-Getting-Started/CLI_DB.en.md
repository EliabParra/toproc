# CLI Deep Dive: Database CLI (`pnpm run db`)

The unified database CLI is the central tool for managing your PostgreSQL schema, syncing Business Objects, and keeping the database in sync across your team.

## Quick Start

```bash
# Interactive mode (menu)
pnpm run db

# Apply schemas (Code → DB)
pnpm run db sync

# View full help
pnpm run db -- --help
```

> **Note:** If using `pnpm`, run `pnpm run db ...`.

---

## Available Actions

| Action       | Command                  | Description                          |
| :----------- | :----------------------- | :----------------------------------- |
| `sync`       | `pnpm run db sync`       | Apply code schemas to DB             |
| `introspect` | `pnpm run db introspect` | Generate schemas from existing DB    |
| `seed`       | `pnpm run db seed`       | Create profiles, admin, register BOs |
| `bo`         | `pnpm run db bo`         | Sync BO methods (detect orphans)     |
| `reset`      | `pnpm run db reset`      | ⚠️ Drop and recreate all tables      |
| `print`      | `pnpm run db print`      | Show SQL without executing           |

---

## CLI Architecture

```
scripts/db/
├── index.ts           # Main entry point
├── cli/
│   └── parser.ts      # Argument parser
├── core/
│   ├── introspector.ts    # DB → Code (Introspection)
│   └── MigrationRunner.ts # Code → DB (Synchronization)
├── schemas/           # 📁 SCHEMAS (Source of Truth)
│   ├── 01_base.ts     # System tables (Manual)
│   ├── 10_users.ts    # User extensions (Manual)
│   ├── 80_auto_x.ts   # Auto-generated (Introspect)
│   └── 90_audit.ts    # Maintenance (Manual)
└── seeders/           # Data population logic
```

---

## Sync: Code → Database

### How It Works

1. The CLI reads all `.ts` files in `scripts/db/schemas/`
2. Orders them numerically.
3. Executes each SQL statement using idempotent logic.

### Naming Convention Standard

To maintain order, we use strict numeric prefixes:

| Range   | Usage                                 | Modifiable |
| :------ | :------------------------------------ | :--------- |
| `00-09` | **System Core** (Profiles, Security)  | Manual     |
| `10-19` | **Core Extensions** (Extended users)  | Manual     |
| `20-49` | **Business Modules** (Products, Auth) | Manual     |
| `50-79` | **Custom Business Logic**             | Manual     |
| `80-89` | **Auto-Generated** (Introspect)       | **Auto**   |
| `90-99` | **Maintenance / Audit**               | Manual     |

> ⚠️ Files in `80-89` will be **OVERWRITTEN** by `introspect` if the table changes. Others are protected.

---

## Introspect: Database → Code

Generate TypeScript schemas from existing tables.

```bash
pnpm run db introspect
```

### New Options

#### Include Data and Indexes

You can also export table **data** (useful for catalogs or configs) and indexes:

```bash
pnpm run db introspect -- --data
# Or in interactive mode, answer "y" when asked.
```

This generates files including:

1. `CREATE TABLE`
2. `INSERT INTO ...` (Data)
3. `CREATE INDEX ...`

### Smart Behavior

- **Protection**: If the table is manually defined (e.g., in `01_base.ts`), introspection **skips it** to preserve your code.
- **Update**: If the table is in a generated file (e.g., `80_public_config.ts`), it will update the file with new structure or data changes.

---

## Seed: Initial Data

### System Profiles

```bash
pnpm run db seed --seedProfiles
```

Creates minimum profiles:

- `profile_id=1`: Admin (full access)
- `profile_id=2`: Public (anonymous access)
- `profile_id=3`: Session (authenticated users)

### Admin User

```bash
pnpm run db seed --seedAdmin
```

Options:

- `--adminUser <name>`: Username (default: `admin`)
- `--adminPassword <pw>`: Password (auto-generates if not specified)
- `--profileId <id>`: Profile to assign (default: 1)

### BO Registration

```bash
pnpm run db seed --registerBo
```

Automatically discovers BOs in `BO/` and registers their methods in `security.methods`.

---

## BO Sync: Bidirectional Synchronization

The most powerful feature for teams.

### Register New Methods

```bash
pnpm run db bo
```

1. Scans `BO/*/BO.ts` looking for `async` methods
2. Registers each method in `security.methods`
3. Assigns `tx` numbers automatically
4. Grants permissions to specified profile

### Detect Orphaned Methods

If someone deleted a method from code but it's still in DB:

```bash
pnpm run db bo
# ⚠️ Found 2 orphaned methods (in DB but not in code):
#    • OldBO.deletedMethod (tx: 50)
#    • OldBO.anotherDeleted (tx: 51)
```

### Clean Up Orphans

```bash
pnpm run db bo --prune
```

This deletes:

1. Associated permissions (`security.permission_methods`)
2. Method records (`security.methods`)

### Dry-Run Mode (Recommended first)

```bash
pnpm run db bo --prune --dry-run
```

Shows what would happen without executing changes.

---

## Reset: Start From Scratch

⚠️ **DANGEROUS** - Deletes ALL data.

```bash
pnpm run db reset
```

In interactive mode, asks for confirmation. For CI/CD:

```bash
pnpm run db reset --yes
```

After reset, automatically re-applies schemas.

---

## Global Options

| Flag               | Description                         |
| :----------------- | :---------------------------------- |
| `--yes`, `-y`      | Non-interactive mode (accept all)   |
| `--dry-run`        | Simulate without executing          |
| `--profile <name>` | Environment profile (dev/prod/test) |
| `--silent`         | Suppress output                     |

### Database Connection

| Flag                | Description          |
| :------------------ | :------------------- |
| `--host <host>`     | PostgreSQL host      |
| `--port <port>`     | Port (default: 5432) |
| `--user <user>`     | Username             |
| `--password <pw>`   | Password             |
| `--database <name>` | Database name        |
| `--ssl`             | Enable SSL           |

### Environment Variables

The CLI respects standard PostgreSQL variables:

```bash
PGHOST=localhost
PGPORT=5432
PGDATABASE=toproc
PGUSER=postgres
PGPASSWORD=secret
```

---

## Troubleshooting

### "Connection Refused"

```
🔥 Fatal Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Causes:**

- PostgreSQL is not running
- Wrong port

**Solution:**

```bash
# Verify service
docker-compose ps  # or systemctl status postgresql
```

### "Authentication Failed"

```
🔥 Fatal Error: password authentication failed
```

**Solution:**

- Verify `PGPASSWORD` in `.env`
- Confirm user/password in pgAdmin

### "Database Does Not Exist"

```
🔥 Fatal Error: database "toproc" does not exist
```

**Solution:**

```sql
CREATE DATABASE toproc;
```

---

## Complete Workflow Examples

### Initial Project Setup

```bash
# 1. Configure connection
cp .env.example .env
# (edit .env with credentials)

# 2. Create base schema
pnpm run db sync

# 3. Create profiles and admin
pnpm run db seed --seedProfiles --seedAdmin

# 4. Register existing BOs
pnpm run db bo
```

### After git pull

```bash
git pull origin main
pnpm run db sync         # Apply new schemas
pnpm run db bo           # Register new methods
```

### Before committing

```bash
pnpm run db bo --dry-run  # Verify state
pnpm run verify           # Quality gate
```

---

## Key Files

| File                       | Purpose                |
| -------------------------- | ---------------------- |
| `scripts/db/schemas/*.ts`  | Your table definitions |
| `scripts/db/core/db.ts`    | Connection class       |
| `scripts/db/cli/parser.ts` | Argument parser        |

---

## See Also

- [Collaborative Workflow](../05-Guides/COLLABORATIVE_WORKFLOW.en.md)
- [BO Generator](CLI_BO.en.md)
- [Security Model](../02-Architecture/SECURITY_SYSTEM.en.md)
