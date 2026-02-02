# The Request Journey (Transaction Flow)

Let's analyze microscopically what happens when you `POST /toProccess`.

## Complete Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    participant Client
    participant Express as Express (Middleware Chain)
    participant TxCtrl as TransactionController
    participant Orch as TransactionOrchestrator
    participant AuthZ as AuthorizationService
    participant Exec as TransactionExecutor
    participant BO as BusinessObject
    participant Audit

    Note over Client,Express: 1. TCP & Middleware
    Client->>Express: POST /toProccess { tx: 101, ... }
    Express->>TxCtrl: handle(req, res)

    Note over TxCtrl,Orch: 2. Orchestration
    TxCtrl->>Orch: execute(tx, context, params)

    Orch->>Orch: Resolve TX -> Route (Mapper)
    Orch->>Orch: Validate Route (Regex)

    Orch->>AuthZ: isAuthorized(profileId, object, method)
    alt Access Denied
        AuthZ-->>Orch: false
        Orch->>Audit: Log "ACCESS_DENIED"
        Orch-->>Client: 403 Forbidden
    end

    Note over Orch,Exec: 3. Secure Execution
    Orch->>Exec: execute(object, method, params)

    Exec->>Exec: Path Containment Check (Security)
    Exec->>BO: Dynamic Import & Instantiate

    BO->>BO: Validate Params (Zod)

    BO->>BO: Business Logic

    BO-->>Exec: Result
    Exec-->>Orch: Result

    Orch->>Audit: Log "EXECUTE_SUCCESS"
    Orch-->>Client: 200 OK
```

## Step-by-Step Analysis

### 1. Middlewares & Controller

As always: Helmet, RateLimit, CSRF. The `TransactionController` receives the request, extracts the session, and immediately delegates to `TransactionOrchestrator`.

### 2. TransactionOrchestrator (The Brain)

1.  **Resolution**: Converts `tx: 101` to `Auth.login`.
2.  **Route Validation**: Checks that `Auth` and `login` are secure names (alphanumeric), preventing command injection.
3.  **Authorization**: Asks `AuthorizationService` if the current user can execute that route.

### 3. AuthorizationService (The Law)

Consults the in-memory permission matrix (RAM). If it says NO, everything stops and a security alert is logged.

### 4. TransactionExecutor (The Muscle)

If everything is legal:

1.  **Path Security**: Verifies that the Business Object file is physically located within the allowed `BO/` folder. Blocks any attempt to escape the directory (`../`).
2.  **Instantiation**: Loads the BO and injects dependencies (`db`, `logger`, `validator`).
3.  **Execution**: Calls the requested method.

### 5. Audit

The orchestrator logs the final result (success or error) in the audit service, guaranteeing complete traceability.
