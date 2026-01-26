# Transaction Flow

Every time someone clicks in your app, a fascinating journey begins. Here is the lifecycle of a request.

## Sequence Diagram

```mermaid
sequenceDiagram
    participant User as User
    participant Express as Web Server
    participant Dispatcher as Dispatcher (Core)
    participant Security as Security
    participant BO as Business Object

    User->>Express: POST /toProccess { tx: 101, data: ... }
    Express->>Dispatcher: processRequest()

    Dispatcher->>Security: Have permission for tx 101?

    alt No Permission
        Security-->>Dispatcher: NO (Error 403)
        Dispatcher-->>User: Error: Access Denied
    else Has Permission
        Security-->>Dispatcher: YES
        Dispatcher->>BO: Instantiate corresponding BO
        Dispatcher->>BO: execute(data)

        BO->>BO: Validate Data (Zod)
        BO->>BO: Execute Logic

        BO-->>Dispatcher: Success Result
        Dispatcher-->>User: JSON { ok: true, data: ... }
    end
```

## Step by Step

1.  **Entry**:
    Everything enters through a single endpoint: `/toProccess`. This simplifies error handling and security.

2.  **Identification (`tx`)**:
    The client sends a transaction code (`tx`). Example: `100` for Login, `200` for Create User.

3.  **Security**:
    Before executing anything, the system checks:
    - Who is the user? (Session/Token)
    - Does this user have permission to execute `tx: 100`?

4.  **Dispatch**:
    If authorized, the `Dispatcher` looks up which code (BO) to run in its transaction map.

5.  **Execution**:
    The Business Object "wakes up", validates data, and does its magic.

6.  **Response**:
    The system always returns a standard JSON format.
