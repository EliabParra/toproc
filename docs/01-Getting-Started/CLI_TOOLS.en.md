# CLI Tools

The framework includes scripts to make your life easier. Here we explain the most useful ones.

## BO Generator (`npm run bo`)

Don't waste time hand-crafting folders and files.

### Create a new BO

```bash
npm run bo new Products
```

This creates `BO/Products` with all necessary files (`BO`, `Service`, `Repository`, `schemas`).

## Maintenance

### Verify Code Health (`npm run verify`)

Runs a series of checks to ensure your code is clean and type-safe.

```bash
npm run verify
```

Includes:

- Cache clean (`clean`)
- Type check (`typecheck`)
- Linter (`lint`)
- Tests (`test`)
- Test build (`build`)

### Generate Documentation (`npm run docs:gen`)

Reads your code and generates a website with technical documentation (JSDoc).

```bash
npm run docs:gen
```

The result will be in `docs/api/index.html`.
