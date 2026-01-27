# Introduction & Philosophy

Welcome to the definitive documentation for **ToProccess**.

> **Reader's Note**: This documentation is designed for everyone, from junior developers to software architects. If a concept seems too basic, feel free to skip it. If it seems too complex, we've included analogies and diagrams to help.

👀 **Looking to start now?**

- **[Quick Start Guide (Docker vs Manual)](../01-Getting-Started/QUICK_START.en.md)** 🚀
- **[Collaborative Workflow (Git, Frontend, Backend)](../05-Guides/COLLABORATIVE_WORKFLOW.en.md)** 🤝

## 1. Project Vision

ToProccess isn't just "another Node.js backend". It's a comprehensive answer to common problems that arise as projects scale: spaghetti code, business logic mixed with database queries, and inconsistent security.

### What problem does it solve?

In traditional frameworks like plain Express, it's easy to start but very easy to make a mess.

- Where do I put validation?
- How do I ensure only admins see this?
- How do I reuse this function without copy-pasting?

ToProccess solves this by imposing **Order and Standards**.

### Design Philosophy: "Rails" over Express

Inspired by the "Convention over Configuration" philosophy.

- **Rigid Structure**: There is a specific place for everything (`BO`, `Service`, `Repository`).
- **Paranoid Security**: Everything is forbidden by default ("Deny by Default").
- **Strong Typing**: We use strict TypeScript. If it compiles, it likely works.

---

## 2. Architecture Pillars

### A. Simplified Clean Architecture

We separate code into concentric layers.

1.  **Domain (Core)**: Your business rules (`BO` and `Service`). They don't know databases or HTTP exist. They are pure.
2.  **Infrastructure (Edge)**: Database, filesystem, email. These are tools the Domain uses.
3.  **Interface (Outer)**: HTTP API. It only handles requests and transforms them.

**Benefit**: You can swap PostgreSQL for MongoDB, or Express for Fastify, and your business logic (the most valuable part) doesn't change a single line.

### B. Dependency Injection

Instead of your objects creating their own dependencies, the system provides them.

- **Before**: `const db = require('db');` (Hard to test, coupled).
- **Now**: `constructor(container) { this.db = container.db; }` (Easy to test, modular).

This allows **Mocking** in tests: we can pass a "fake database" to the BO to test it without touching the real database.

### C. Transaction-Oriented Programming (RPC-Style)

Unlike pure REST (GET /users, POST /users), we think in terms of **Business Actions**.

- `tx: 101` -> "Login"
- `tx: 205` -> "Approve Vacation Request"

Each action has a unique ID. This greatly facilitates:

- **Audit**: "Who executed tx 205?"
- **Permissions**: "Does Role X have permission for tx 205?"

---

## 3. Fundamental Glossary

Before continuing, let's define the vocabulary we will use throughout the documentation.

| Term                     | Simplified Definition                                                                               | Analogy                                                                              |
| :----------------------- | :-------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------- |
| **BO (Business Object)** | Module grouping a complete functionality (Controller + Service + Repository).                       | A "Department" in a company (e.g., Sales Dept.).                                     |
| **Dispatcher**           | The component that receives the HTTP request, finds which BO handles it, loads it, and executes it. | The building receptionist who tells you which office to go to.                       |
| **Container**            | Object containing all global tools (DB, Logger, Config) passed to all BOs.                          | A master toolbox given to every worker.                                              |
| **Tx (Transaction ID)**  | Unique number identifying a specific operation.                                                     | The ticket number at the bank.                                                       |
| **Zod**                  | Library used to validate that input data is correct.                                                | The security guard checking your ID and backpack before entering.                    |
| **Lazy Loading**         | Technique of loading files only when needed, not at startup.                                        | Turning on the light in a room only when you enter, not keeping the whole house lit. |

---

## 4. Who is this for?

- **Backend Developers**: To build robust APIs.
- **Tech Leads**: To have a solid, standardized foundation for their team.
- **QA / Testers**: To understand how to test transactional flows.

## Next Step

Now that you understand the philosophy, let's look at how the code is physically organized in [Detailed File Structure](FILE_STRUCTURE.en.md).
