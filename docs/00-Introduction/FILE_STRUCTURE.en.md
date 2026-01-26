# File Structure Explained

Here we explain what is in each folder so you don't get lost.

```text
/
├── BO/                      # [Business Objects] YOUR business code lives here.
│   ├── Auth/                # Example module (Authentication)
│   └── ...                  # You will create your new modules here.
│
├── docs/                    # [Documentation] Where you are reading this.
│
├── src/                     # [Source] The heart of the framework.
│   ├── api/                 # HTTP Entry (Express) and Dispatcher.
│   ├── config/              # Environment variables loader (.env).
│   ├── core/                # Fundamental pieces (don't touch unless you know what you're doing).
│   │   ├── base/            # Base classes (BaseBO).
│   │   ├── security/        # Security Service.
│   │   └── transaction/     # Transaction Executor.
│   │
│   ├── db/                  # Database Connection.
│   ├── express/             # Web Server Configuration.
│   ├── infra/               # External Services (Audit, Email).
│   ├── logger/              # Logging System.
│   ├── session/             # Connected User Management.
│   └── types/               # TypeScript Definitions.
│
├── test/                    # Unit and Integration Tests.
├── .env.example             # Configuration Template.
└── package.json             # Project Dependencies.
```

## Golden Rules

1.  **Business code goes in `BO/`**: If you are creating a feature to sell products, create `BO/Products`. Do not touch `src/core`.
2.  **`src/` is infrastructure**: `src` contains the "engine" of the car. `BO` contains the "destination" of the trip. Only modify `src` if you are upgrading the engine.
