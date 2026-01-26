# CLI Tools (Summary)

ToProccess includes several scripts to automate your workflow.

## Deep Dive Tool Index

We have created exhaustive documentation for the most complex tools:

1.  **[BO Generator (npm run bo)](CLI_BO.en.md)**
    Learn how to create modules, services, and repositories automatically with a single command.

2.  **[DB Initializer (npm run db:init)](CLI_DB_INIT.en.md)**
    Discover how to bootstrap your database, configure schemas, and troubleshoot connection issues.

---

## Other Important Tools

### Health Check (`npm run verify`)

The quality guardian. Run it before every commit.

**Execution Cycle**:

1.  `clean`: Cleans residues.
2.  `typecheck`: Validates strict TypeScript.
3.  `build`: Compiles to JS.
4.  `smoke-dist`: Tests that build starts.
5.  `test`: Passes all unit tests.

```bash
npm run verify
```

### Technical Documentation Generator (`npm run docs:gen`)

If you write JSDoc comments in your code, this tool generates a navigable website.

```bash
npm run docs:gen
```

The result is saved in `docs/api/`. Useful for viewing class diagrams and method references for the entire framework.
