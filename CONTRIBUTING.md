# Contributing

Thanks for taking the time to contribute.

## Development setup

- Requires Node.js and pnpm.
- Install dependencies:

```bash
pnpm ci
```

## Running tests

```bash
pnpm test
```

Optional (recommended):

```bash
pnpm run verify
pnpm run test:watch
pnpm run test:coverage
```

## Pull requests

- Keep PRs focused and small.
- Include a clear description of what changed and why.
- Add or update tests when behavior changes.
- Make sure `pnpm test` passes.

## Reporting security issues

Please do not open public issues for security vulnerabilities.

See [SECURITY.md](SECURITY.md) for the preferred reporting channel.
