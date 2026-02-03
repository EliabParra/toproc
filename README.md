<div align="center">

<picture>
	<source media="(prefers-color-scheme: dark)" srcset="assets/branding/toproc-logo.light.svg" />
	<img alt="Toproc" src="assets/branding/toproc-logo.dark.svg" width="150" />
</picture>

_**ToProccess core**: tx-driven secure dispatch backend._

[![Node.js (ESM)](https://img.shields.io/badge/Node.js-ESM-3c873a?style=for-the-badge)](#)
[![Express](https://img.shields.io/badge/Express-5.x-000000?style=for-the-badge)](#)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-required-336791?style=for-the-badge)](#)
[![Tests](https://img.shields.io/badge/Tests-141%20passing-2f6feb?style=for-the-badge)](#)
[![CI](https://img.shields.io/github/actions/workflow/status/EliabParra/toproc/ci.yml?branch=master&style=for-the-badge)](https://github.com/EliabParra/toproc/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-2f6feb?style=for-the-badge)](LICENSE)

</div>

**Español:** ver [README.es.md](README.es.md)

Toproc is a modern, **Transaction-Oriented** backend architecture designed for applications requiring high security, granular traceability, and "Zero-Magic".

Unlike traditional MVC frameworks, Toproc does not expose resources (REST Endpoints), but **Business Intents**.

## ✨ Key Features

### 🛡️ Security by Design (Transaction-Oriented)

- **Single Entry Point**: All traffic flows through `POST /toProccess`.
- **Deny by Default**: If a Transaction (e.g., `1001`) is not mapped and authorized in DB, it doesn't exist.
- **Granular Audit**: We know exactly _who_, _when_, and _with what_ parameters attempted each action.

### 🧩 Robust Architecture & DI

- **TypeScript Strict**: Static typing throughout the lifecycle (Zod -> Service -> Repository).
- **Dependency Injection**: Business Objects (`BO`) receive their dependencies (`db`, `email`, `log`) via `BOService` base class, facilitating unit testing.
- **Smart Abstractions**:
    - `BaseBO`: Handles validation/execution flow (`.exec()`).
    - `CrudBO`: Auto-implements standard CRUD operations.
    - `BOService`: Provides typed access to core resources.
- **Zod Deep Integration**: Input validation, `.env` typing, and automatic sanitization.

### 🔋 "Batteries Included"

- **Full Auth Module**: Login, Register, Email Verification (OTP), Password Reset, and CSRF Protection.
- **Ready Infrastructure**: Postgres Sessions, Rate Limiting, Secure CORS, and Structured Logs (JSON/Text).
- **CLI Tools**: Code generators (`pnpm run bo`), DB initializers, and maintenance scripts.

---

## 🚀 Quickstart

### 1. Requirements

- Node.js 20+
- PostgreSQL 14+

### 2. Installation

```bash
git clone ...
pnpm install
```

### 3. Configuration

Copy the example file and adjust your Postgres credentials.

```bash
cp .env.example .env
```

> **Note**: System won't start if it detects invalid config (Zod Validation).

### 4. Initialization

Create system tables (`security`, `session`, `audit`).

```bash
pnpm run db
```

### 5. Start

```bash
pnpm run dev
```

---

## 📚 Master Documentation (EN)

### 🚀 01. Getting Started

- [Overview & Structure](docs/00-Introduction/FILE_STRUCTURE.en.md)
- [Installation](docs/01-Getting-Started/MANUAL_INSTALLATION.en.md)
- [Environment Config (.env)](docs/01-Getting-Started/ENVIRONMENT.en.md)
- [Your First Business Object](docs/05-Guides/CREATE_NEW_MODULE.en.md)
- [CLI Tools](docs/01-Getting-Started/CLI_TOOLS.en.md)

### 🏛️ 02. Architecture

- [Security & Permission System](docs/02-Architecture/SECURITY_SYSTEM.en.md)
- [The AppServer (Core)](docs/02-Architecture/APPSERVER_CORE.en.md)
- [Dependency Injection](docs/02-Architecture/DEPENDENCY_INJECTION.en.md)
- [Session Management](docs/02-Architecture/SESSIONS.en.md)

### 🧠 03. Core Concepts

- [Authentication Module](docs/03-Core-Concepts/AUTH_MODULE.en.md)
- [Validation System (Zod)](docs/03-Core-Concepts/VALIDATION_SYSTEM.en.md)
- [Exception Strategy](docs/03-Core-Concepts/EXCEPTION_STRATEGY.en.md)
- [Business Objects (BaseBO)](docs/03-Core-Concepts/BUSINESS_OBJECTS.en.md)

### 🏗️ 04. Infrastructure

- [Database Layer (Pg)](docs/04-Infrastructure/DATABASE_LAYER.en.md)
- [Logging & Audit System](docs/04-Infrastructure/LOGGING_SYSTEM.en.md)
- [Email Service](docs/04-Infrastructure/EMAIL_SERVICE.en.md)

### 🔌 06. API Reference

- [Messaging Standard](docs/06-API-Reference/API_REFERENCE.en.md)
- [Endpoints & HTTP Codes](docs/06-API-Reference/API_REFERENCE.en.md)

### 🎨 07. Frontend Adapters

- [Adapter Pattern (General)](docs/07-Frontend-Adapters/ADAPTER_PATTERN.en.md)
- [React Guide (Hooks)](docs/07-Frontend-Adapters/REACT_GUIDE.en.md)
- [Angular Guide (Service)](docs/07-Frontend-Adapters/ANGULAR_GUIDE.en.md)
- [Vue Guide (Composable)](docs/07-Frontend-Adapters/VUE_GUIDE.en.md)

---

## 🛠️ Available Scripts

| Script                  | Description                                    |
| :---------------------- | :--------------------------------------------- |
| `pnpm run dev`          | Development mode with `nodemon` (Hot Reload).  |
| `pnpm start`            | Production mode (Runs `dist/index.js`).        |
| `pnpm run verify`       | **Quality Gate**: Typecheck + Build + Tests.   |
| `pnpm run db`           | Interactive DB CLI (sync, seed, reset).        |
| `pnpm run config:check` | Validates `.env` file without starting server. |
| `pnpm run bo <cmd>`     | BO CLI: `new`, `sync`, `list`.                 |
| `pnpm run docs:gen`     | Generates API documentation (TypeDoc).         |
| `pnpm run hashpw`       | Utility to manually hash passwords.            |

---

## License

MIT. See [LICENSE](LICENSE).
