# CLI Deep Dive: Business Object Generator (`npm run bo`)

The Business Object generator is your best friend to avoid writing "boilerplate" (repetitive code).
It handles creating the standard 4-layer structure in seconds.

## Main Command

```bash
npm run bo new <EntityName> [options]
```

### Arguments

| Argument     | Required | Description                                               |
| :----------- | :------- | :-------------------------------------------------------- |
| `EntityName` | Yes      | Module name (PascalCase). Ex: `Products`, `UserInvoices`. |

### Options (Flags)

| Flag        | Alias | Default                    | Description                                                |
| :---------- | :---- | :------------------------- | :--------------------------------------------------------- |
| `--methods` | `-m`  | `get,create,update,delete` | Comma-separated list of methods to generate in the BO.     |
| `--dry-run` | `-d`  | `false`                    | Shows what files would be created without writing to disk. |

---

## Usage Examples

### 1. The Basic (Full CRUD)

Creates a module with `get`, `create`, `update`, `delete`.

```bash
npm run bo new Tickets
```

**Result on disk (`src/BO/Tickets/`)**:

- `TicketsBO.ts`: Controller with the 4 methods.
- `TicketsService.ts`: Empty logic ready to fill.
- `TicketsRepository.ts`: SQL query placeholders.
- `schemas.ts`: Basic Zod schemas for the 4 methods.

### 2. Custom (Read Only)

If you are creating a report that only reads data, you don't need `create` or `delete`.

```bash
npm run bo new DailyReports --methods "search,exportPDF"
```

**Result**:
The `DailyReportsBO.ts` will only have `search` and `exportPDF`. This keeps code clean from day 1.

### 3. Safe Test (Dry Run)

Not sure what will happen? Use this before messing up your project.

```bash
npm run bo new ComplexModule --dry-run
```

**Output**:

```text
[DRY] would create /path/to/project/BO/ComplexModule
[DRY] Would write to .../ComplexModuleBO.ts
...
```

---

## FAQ

### What if the folder already exists?

The script will fail to protect you from overwriting existing work.
**Solution**: Delete the folder manually or use another name.

### Can I edit the templates?

Yes! Templates live in `scripts/bo/templates/`.
If your team decides all BOs must have an `audit()` method, edit the `bo.ts` template there and all future BOs will have it.

### Why does it create 4 files?

It's the framework architecture:

1.  **BO**: Public interface.
2.  **Service**: Brain.
3.  **Repository**: Muscle (DB).
4.  **Schema**: Validation.
    Keeping them separate from the start prevents ending up with a 2000-line file.
