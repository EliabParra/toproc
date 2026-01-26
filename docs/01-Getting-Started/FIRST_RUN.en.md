# Running the Project

All set! Time to start the engines.

## 1. Initialize the Database

Before running the server for the first time, we need to create the base tables in PostgreSQL. Our framework includes a tool for this.

Run:

```bash
npm run db:init
```

This will create:

- Schema `security`.
- Tables: `users`, `profiles`, `sessions`, `audit`, etc.
- A default admin user (if configured).

## 2. Development Mode

For coding, use development mode. This mode:

- Automatically restarts the server when you save changes.
- Shows nice, readable logs.

```bash
npm run dev
```

You should see something like:

```text
[INFO] Server listening on port 3000
```

## 3. Production Mode

On a real server, we want speed and stability.

1.  **Build**: Compiles TypeScript to optimized JavaScript.

    ```bash
    npm run build
    ```

    This creates the `dist/` folder.

2.  **Start**: Runs the compiled code.
    ```bash
    npm start
    ```

## 4. Verify it works

Open your browser at:
`http://localhost:3000/health`

You should see an `OK` message.

## Next Step

With the server running, understand how it works by reading [Architecture](../02-Architecture/OVERVIEW.en.md).
