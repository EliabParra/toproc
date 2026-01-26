# CLI Deep Dive: Database Initializer (`npm run db:init`)

This script is the heart of the infrastructure. It doesn't just "create tables", it orchestrates the entire initial project environment.

## Step-by-Step Breakdown

When you run `npm run db:init`, the script `scripts/db-init/index.ts` takes control and performs these 4 critical phases:

### Phase 1: Configuration (`ConfigBuilder`)

1.  Reads CLI arguments (flags).
2.  Asks interactively (prompts) if critical data is missing and you aren't in Non-Interactive mode.
3.  Validates final configuration.

### Phase 2: Connection (`Database`)

Attempts to connect to PostgreSQL using env variables.

- If it fails, it tells you exactly what credentials it tried (Host, Port, User).
- This saves hours of "Why won't it connect?" debugging.

### Phase 3: Schema Execution (`Executor`)

Runs idempotent SQL scripts (safe to run multiple times).

1.  **Base Schema**: Vital system tables.
2.  **Auth Schema**: (Optional) Creates `users`, `profiles`, `sessions` tables if auth is enabled.
3.  **Audit Schema**: Creates `audit_log` table for the audit system.

### Phase 4: Generators (`Generators`)

Magic happening after DB.

1.  **.env Generator**: If it detects you lack `.env`, creates one based on `.env.example`.
2.  **Docs Generator**: (Experimental) Can inspect your DB and generate Markdown documentation of your tables.

---

## Flags and Options

```bash
npm run db:init -- [options]
```

| Flag           | Description                                        | Typical Usage                     |
| :------------- | :------------------------------------------------- | :-------------------------------- |
| `--dry-run`    | Simulates everything without touching DB or files. | Seeing what would happen in Prod. |
| `--force`      | (Dangerous) Forces destructive table recreation.   | Resetting local environment.      |
| `--no-auth`    | Skips auth table creation.                         | Microservice handling no users.   |
| `--yes` / `-y` | "Non-Interactive" mode. Accepts all defaults.      | CI/CD Scripts (GitHub Actions).   |

---

## Troubleshooting

### "Connection Refused"

- **Cause**: Postgres not running or port 5432 blocked.
- **Solution**: Open pgAdmin and verify connection.

### "Authentication Failed"

- **Cause**: Wrong password in `.env`.
- **Solution**: Edit `.env` and ensure `PGPASSWORD` is correct.

### "Database does not exist"

- **Cause**: Trying to connect to a DB you haven't created.
- **Solution**: Run `CREATE DATABASE toproc;` in your SQL shell before running script.

---

## Key Files

If you need to modify which tables are created, these are the files to touch:

- `scripts/db-init/schema/base.ts`: General tables.
- `scripts/db-init/schema/auth.ts`: Users/Login tables.
- `scripts/db-init/schema/audit.ts`: Log tables.
