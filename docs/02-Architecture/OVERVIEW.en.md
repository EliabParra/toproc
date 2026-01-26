# Architecture Overview

Our system follows a pragmatic version of **Clean Architecture**. The goal is to separate responsibilities so code remains maintainable.

## Layer Diagram

```mermaid
graph TD
    Client[Client] -->|HTTP| API[API Layer (Express)]
    API -->|Dispatches| Core[Core Layer (Dispatcher/Security)]
    Core -->|Executes| BO[Business Objects (Logic)]
    BO -->|Uses| Infra[Infrastructure Layer (DB/Email)]

    classDef client fill:#f9f,stroke:#333;
    classDef api fill:#bbf,stroke:#333;
    classDef core fill:#dfd,stroke:#333;
    classDef bo fill:#fdd,stroke:#333;
    classDef infra fill:#ddd,stroke:#333;

    class Client client;
    class API api;
    class Core core;
    class BO bo;
    class Infra infra;
```

## The 4 Main Layers

1.  **API Layer (`src/api`, `src/express`)**:
    - The "front door".
    - Receives HTTP requests.
    - Has NO business logic. Just "passes the ball" to Core.

2.  **Core Layer (`src/core`)**:
    - The "administrative brain".
    - `SecurityService`: Checks permissions.
    - `Dispatcher`: Decides who to call.
    - Ensures NO ONE enters without permission.

3.  **Business Objects (`BO/`)**:
    - YOUR code lives here.
    - Contains all business logic (e.g., "How to create a product").
    - Data Validation (Zod).

4.  **Infrastructure Layer (`src/db`, `src/infra`)**:
    - The "technical services".
    - Database, Email, Logs.
    - BOs use these services but don't know how they work internally.

## Why this way?

If tomorrow we swap PostgreSQL for MySQL, we only touch the Infrastructure Layer. Your business logic (`BO/`) doesn't notice and doesn't break.
