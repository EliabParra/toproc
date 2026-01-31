# CLI Tools (Summary)

ToProccess includes several scripts to automate your workflow.

## Deep Dive Tool Index

We have created exhaustive documentation for the most complex tools:

1.  **[BO Generator (pnpm run bo)](CLI_BO.en.md)**
    Learn how to create modules, services, and repositories automatically with a single command.

2.  **[Database CLI (pnpm run db)](CLI_DB.en.md)**
    The central tool for managing schemas, syncing BOs, and keeping the DB in sync across your team.

---

## Other Important Tools

### Health Check (`pnpm run verify`)

The quality guardian. Run it before every commit.

**Execution Cycle**:

1.  `clean`: Cleans residues.
2.  `typecheck`: Validates strict TypeScript.
3.  `build`: Compiles to JS.
4.  `smoke-dist`: Tests that build starts.
5.  `test`: Passes all unit tests.

```bash
pnpm run verify
```

### Business Documentation Generator (`pnpm run docs:bo`)

Automatically generates an index of all **Business Objects** and transactions available in your system.

```bash
pnpm run docs:bo
```

- **Output**: `docs/05-Guides/BO_INDEX.md`
- **Usage**: Run after creating new BOs to keep documentation up to date.

### Interactive Playground (`pnpm run playground`)

Test your validation rules (Zod) interactively without Postman or starting the server.

```bash
pnpm run playground
```

- **Commands**: `auth.login {"email":"x", "password":"123"}`
- **Benefit**: Immediate feedback on whether your schemas are correct.

### Code Audit (`pnpm run audit`)

Scans your source code for architectural anti-patterns.

```bash
pnpm run audit
```

- **Rules**: Forbids `console.log` (use `this.log`), direct `req.body` access, deep imports, etc.
- **CI/CD**: If errors are found, the build fails.

### VSCode Snippets

The project includes configuration for **Smart Autocomplete**.

In any `.ts` file, type:

- `tp-bo`: Creates the base structure of a Business Object class.
- `tp-bo-method`: Adds a transactional method to an existing BO.
- `tp-schema`: Creates a standard Zod schema.
- `tp-service`: Creates a service with injected dependencies.
- `tp-repo-method`: Creates a DB access method.
- `tp-test`: Creates a test suite (Node Test Runner).
- `tp-log`: Inserts a standard log line.
