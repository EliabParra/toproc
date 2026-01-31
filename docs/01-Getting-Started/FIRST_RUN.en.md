# Deep Dive into First Run

You installed everything and configured the environment. Now let's see what happens when you "push the power button".

## 1. Database Initialization (`pnpm run db:init`)

This command is critical for the first run.

### What exactly does it do?

1.  **Connection**: Connects to your Postgres using credentials from `.env`.
2.  **Verification**: Checks if tables already exist.
3.  **SQL Execution**: Runs initialization scripts located in `scripts/db-init/schema/`.
    - `audit.ts`: Creates `audit_log` table.
    - `auth.ts`: Creates `users`, `profiles`, `sessions` tables.
    - `base.ts`: System base tables.
4.  **Generators**: Creates dynamic files if necessary (e.g. automatic database documentation).

### Usage

```bash
pnpm run db:init
```

**Expected Output:**

```text
✅ Connected to DB
🚀 DB Init Complete
```

> **Note**: If it fails, check your `PGPASSWORD` in the `.env` file. 99% of errors are wrong credentials.

---

## 2. Development Mode (`pnpm run dev`)

This is the command you will use 90% of the time.

### Magic Features

- **Hot Reload (Nodemon)**: You don't need to stop and restart the server. If you edit a file and save (`Ctrl+S`), the server restarts itself in less than 1 second.
- **TypeScript on-the-fly (`tsx`)**: Runs `.ts` code directly without compiling to disk. It's very fast.
- **Watch Mode**: Watches key folders (`src`, `BO`, `public`).

### Usage

```bash
pnpm run dev
```

**Verification**:
Open `http://localhost:3000/health`. You should see: `OK`.

---

## 3. Production Mode (`pnpm run build` + `pnpm start`)

This is how it should run on AWS, DigitalOcean, or your real server. Never use `pnpm run dev` in production (it's slow and insecure).

### Step A: Compilation (`pnpm run build`)

Transforms your TypeScript code (pretty but heavy) into standard JavaScript (ugly but super fast).

- **Input**: `src/`, `BO/` folders.
- **Output**: `dist/` folder.

> **Why compile?**
> Node.js doesn't natively understand TypeScript. Compilation removes types and optimizes code.

### Step B: Execution (`pnpm start`)

Runs the optimized code from the `dist/` folder.

```bash
pnpm start
```

---

## Lifecycle Summary

1.  **Install** (`pnpm install`)
2.  **Configure** (`.env`)
3.  **Init DB** (`pnpm run db:init`)
4.  **Code** (`pnpm run dev`)
5.  **Deploy** (`pnpm run build` -> `pnpm start`)

## Next Step

You know how to run it. Now learn to use the power tools in [CLI Tools](CLI_TOOLS.en.md).
