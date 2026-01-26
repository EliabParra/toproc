# Environment Variables (.env)

The `.env` file controls how the application behaves on your computer. **You must NEVER commit this file to Git**, as it contains secret passwords.

## Initial Setup

Copy the example file to create your own `.env`:

```bash
cp .env.example .env
# On Windows (PowerShell): Copy-Item .env.example .env
```

## Key Variables

Here is what each one does:

### Application

- `APP_PORT`: Port where the server runs (Default: `3000`).
- `APP_LANG`: Default language (`es` or `en`).

### Database

You have two ways to configure PostgreSQL:

1.  **Option A (Recommended Local)**: Individual variables.

    ```properties
    PGHOST=localhost
    PGPORT=5432
    PGDATABASE=curso-node
    PGUSER=postgres
    PGPASSWORD=your_password
    ```

2.  **Option B**: Full connection string (URL).
    ```properties
    DATABASE_URL=postgres://user:password@host:port/db
    ```

### Sessions

- `SESSION_SECRETS`: A secret phrase used to sign cookies. **Change this in production**.

## Next Step

With variables ready, it's time to [Run the Project](FIRST_RUN.en.md).
