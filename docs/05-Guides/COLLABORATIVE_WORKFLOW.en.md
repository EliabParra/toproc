# 🤝 Collaborative Development Guide

This guide details how to use **ToProccess Framework** as a foundation for building a real application as a team. It covers everything from repository structure to daily workflows for Backend and Frontend.

## 1. Project Architecture (Repositories)

For modern applications, we recommend separating code into two distinct repositories. This allows for independent deployment cycles and team specialization.

### Recommended Structure

```text
MySuperApp/ (Organization on GitHub/GitLab)
├── my-app-backend/   <-- (ToProccess Framework Clone)
│   ├── .github/
│   ├── src/
│   ├── BO/
│   ├── Dockerfile
│   └── docker-compose.yml
│
└── my-app-frontend/  <-- (React, Vue, Angular, Next.js)
    ├── src/
    ├── package.json
    └── ...
```

### 🚀 Lift-off (Tech Lead / Initializer)

1.  **Backend**:
    - Use this framework as a "Template" or clone it.
    - Rename the project in `package.json` and `docker-compose.yml` (e.g., `my-app-api`).
    - Clean up examples you don't need (optional).
    - Push code to `my-app-backend`.
2.  **Frontend**:
    - Start your project (e.g., `npm create vite@latest`).
    - Configure HTTP client to point to `http://localhost:3000`.

---

## 2. Backend Workflow (The API Team)

### A. Onboarding (New Developer)

When "Alice" joins the Backend team:

1.  `git clone .../my-app-backend`
2.  `cp .env.example .env` (Request secret credentials from the team if any).
3.  **Docker Mode (Recommended)**:
    - `docker-compose up -d`
    - `docker-compose exec api npm run db:init`
4.  **Manual Mode**:
    - Install Node/Postgres.
    - Create local DB.
    - `npm run db:init`

### B. Daily Development Cycle

1.  **Sync**: `git pull origin main`
2.  **Update Database**:
    - Always run `npm run db:init` after a pull.
    - _Why?_ If someone added a new table yesterday, this command will create it on your machine.
3.  **Code**:
    - Create your branch: `git checkout -b feature/new-feature`
    - Create your BOs, Routes, etc.
4.  **Database Changes**:
    - ⚠️ **Do not make manual changes in your local DB** (pgAdmin).
    - Add changes in `scripts/db-init/schema/`.
    - Test that they run well with `npm run db:init`.
    - _Golden Rule_: The code is the single source of truth for the database.
5.  **Pull Request**:
    - Push your code. CI/CD should run `npm run verify`.

---

## 3. Frontend Workflow (The UI Team)

The Frontend team needs the Backend to work, but doesn't necessarily need to touch its code.

### Option A: Backend in Docker (Cleanest)

The Frontend developer:

1.  Clones `my-app-backend`.
2.  Runs `docker-compose up -d`.
3.  Forgets about the backend. Focuses on their `my-app-frontend` repo.
    - If Backend updates, they just do `git pull && docker-compose restart` in the backend folder.

### Option B: Remote API (Staging)

If you have a testing server (Staging) in the cloud:

1.  Frontend configures their `.env`: `VITE_API_URL=https://api-staging.my-app.com`.
2.  No need to run backend locally.
3.  _Downside_: If internet fails or Staging breaks, development is blocked.

### Integration (CORS and Ports)

- Backend runs on port `3000`.
- Frontend usually runs on `5173` (Vite) or `4200` (Angular).
- **CORS**: In `src/app.ts`, ensure frontend origin is allowed or use `*` (asterisco) only for development.

---

## 4. Team Database Management

The biggest collaborative challenge is keeping everyone's database in sync.

### 🚫 The Setup to AVOID

- Alice creates a table manually on her PC.
- Pushes code that uses that table.
- Bob pulls code, runs the app, and... **Crash!** "Relation does not exist".

### ✅ The ToProccess Way

1.  Alice edits `scripts/db-init/schema/my-tables.ts` and adds the `CREATE TABLE`.
2.  Alice verifies that `db:init` works.
3.  Alice pushes the `.ts` file.
4.  Bob pulls code, runs `db:init`, and the table magically appears.

> **Note**: `db:init` is designed to be **idempotent** (can be run a thousand times safely). Use `CREATE TABLE IF NOT EXISTS` always.

---

## 5. Command Summary

| Situation        | Backend Repo                                              | Frontend Repo                        |
| :--------------- | :-------------------------------------------------------- | :----------------------------------- |
| **Start of Day** | `git pull`<br>`npm run db:init`<br>`docker-compose up -d` | `git pull`<br>`npm run dev`          |
| **New Feature**  | `npm run bo` (Create files)<br>Code...<br>Tests...        | Code components...<br>Consume API... |
| **DB Changed**   | Add SQL in `scripts/`                                     | (Wait for Backend to notify)         |
| **Finish**       | `git push`                                                | `git push`                           |
