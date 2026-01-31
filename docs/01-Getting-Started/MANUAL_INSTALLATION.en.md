# Ultimate Installation Guide

> **Estimated time**: 10 to 15 minutes.
> **Level**: Beginner.

This guide assumes you are starting from scratch, perhaps with a brand-new computer.

## 1. System Requirements

Before copying a single line of code, verify this.

| Tool           | Min Version | Check Command    | Why do I need it?                                    |
| :------------- | :---------- | :--------------- | :--------------------------------------------------- |
| **Node.js**    | v20.x (LTS) | `node -v`        | The engine that runs our JavaScript/TypeScript code. |
| **pnpm**       | v9.x        | `pnpm -v`        | The optimized package manager.                       |
| **PostgreSQL** | v14.x       | `psql --version` | Where we store data (Users, Transactions).           |
| **Git**        | v2.x        | `git --version`  | To download this code and save yours.                |

### How to install missing tools?

#### Windows

We recommend using the official installers from [nodejs.org](https://nodejs.org/) and [postgresql.org](https://www.postgresql.org/).
_Pro Tip_: Install `pgAdmin` along with Postgres to see your tables visually.

#### MacOS

If you have Homebrew:

```bash
brew install node postgresql git
```

#### Linux (Ubuntu/Debian)

```bash
sudo apt update
sudo apt install nodejs pnpm postgresql git
```

---

## 2. Preparing the Code

Go to the folder where you keep your projects (e.g. `C:\Users\YourUser\Dev` or `~/Dev`).

### Cloning the Repository

```bash
git clone <repo-url>
cd nodejs-backend-architecture
```

### Understanding `pnpm install`

When you run the following command, `pnpm` reads the `package.json` file.

```bash
pnpm install
```

**What is happening?**

1.  Downloads production dependencies (`dependencies`): Express, Zod, PG.
2.  Downloads development tools (`devDependencies`): TypeScript, TypeDoc, Prettier.
3.  Creates the `node_modules` folder. **Never touch that folder**.

> **Common Issues**:
>
> - _Permission Errors_: Try opening the terminal as Administrator (Windows) or use `sudo` (Linux/Mac).
> - _Python not found_: Ignore it, it's optional for some native builds.

---

## 3. Local Database Configuration

For the project to work on your machine, you need to create an empty database.

1.  Open `pgAdmin` or your SQL terminal.
2.  Run this SQL command:
    ```sql
    CREATE DATABASE "toproc";
    -- The name can be anything, but we use this in examples.
    ```
3.  Make sure you know your user (usually `postgres`) and verify your password.

## Next Step

Now you have the code and an empty database. But how does the code know how to connect to that database?
Let's configure the [Environment & Variables (.env)](ENVIRONMENT.en.md).
