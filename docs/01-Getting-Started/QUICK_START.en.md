# 🚀 Quick Start Guide

Welcome to **ToProccess Framework**. We have designed two paths for you to start developing, depending on your preferences and environment.

## 🛤️ Choose Your Path

| Feature          | 🐳 Option A: Docker (Recommended) | 🛠️ Option B: Manual (Classic)     |
| :--------------- | :-------------------------------- | :-------------------------------- |
| **Requirements** | Only Docker Desktop.              | Node.js v20, Postgres v15, Git.   |
| **Setup**        | Automatic (Zero config).          | Manual (Env vars, Local DB).      |
| **Environment**  | Identical to Production (Linux).  | Depends on your OS (Windows/Mac). |
| **Ideal for**    | Quick start, teams, Windows.      | Full control, low resources.      |

---

## 🐳 Option A: Docker (The Fast Lane)

This is the project standard. You don't need to install Node.js or Postgres on your machine.

### 1. Prerequisites

- Have **Docker Desktop** installed and running.

### 2. Start the Environment

Run this command in the project root:

```bash
docker-compose up -d
```

> _This will download the images and start the API and Database._

### 3. Initialize Database (First time only)

Once the containers are up (green in Docker Desktop), run:

```bash
docker-compose exec api pnpm run db:init -- --yes --profile development
```

### 4. Start Developing!

- Your API is at: `http://localhost:3000`
- **Hot Reload**: Edit any file in `src/` and read. The server will restart automatically.
- **Logs**: To see what's happening, use `docker-compose logs -f`.

---

## 🛠️ Option B: Manual Installation

If you prefer full control and running tools natively on your OS.

### 1. Prerequisites

You need to manually install:

- Node.js v20 (LTS)
- PostgreSQL v15+

### 2. Configuration

Follow the detailed step-by-step guide:
👉 **[Go to Manual Installation Guide](INSTALLATION.en.md)**

---

## Development Workflow (Day to Day)

### Common Commands

| Action               | 🐳 Docker                                | 🛠️ Manual          |
| :------------------- | :--------------------------------------- | :----------------- |
| **Start Server**     | `docker-compose up -d`                   | `pnpm run dev`     |
| **View Logs**        | `docker-compose logs -f`                 | (In your terminal) |
| **Create BO/Schema** | `docker-compose exec api pnpm run bo`    | `pnpm run bo`      |
| **Tests**            | `docker-compose exec api pnpm test`      | `pnpm test`        |
| **Audit**            | `docker-compose exec api pnpm run audit` | `pnpm run audit`   |

### Pro Tips

- **Enter the container**: If you need to run many commands in a row in Docker:
    ```bash
    docker-compose exec api sh
    # You are now inside Linux. Run 'pnpm run ...' directly.
    ```
