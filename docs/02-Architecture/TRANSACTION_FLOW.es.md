# El Viaje de una Petición (Transaction Flow)

Vamos a analizar microscópicamente qué pasa cuando haces `POST /toProccess`.

## Diagrama de Secuencia Completo

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

    Note over TxCtrl,Orch: 2. Orquestación
    TxCtrl->>Orch: execute(tx, context, params)

    Orch->>Orch: Resolver TX -> Route (Mapper)
    Orch->>Orch: Validar Ruta (Regex)

    Orch->>AuthZ: isAuthorized(profileId, object, method)
    alt Access Denied
        AuthZ-->>Orch: false
        Orch->>Audit: Log "ACCESS_DENIED"
        Orch-->>Client: 403 Forbidden
    end

    Note over Orch,Exec: 3. Ejecución Segura
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

## Análisis Paso a Paso

### 1. Middlewares y Controller

Igual que siempre: Helmet, RateLimit, CSRF. El `TransactionController` recibe la petición, extrae la sesión y delega inmediatamente al `TransactionOrchestrator`.

### 2. TransactionOrchestrator (El Cerebro)

1.  **Resolución**: Convierte `tx: 101` en `Auth.login`.
2.  **Validación de Ruta**: Verifica que `Auth` y `login` sean nombres seguros (alfanuméricos), evitando inyección de comandos.
3.  **Autorización**: Pregunta al `AuthorizationService` si el usuario actual puede ejecutar esa ruta.

### 3. AuthorizationService (La Ley)

Consulta la matriz de permisos en memoria (RAM). Si dice NO, se detiene todo y se registra una alerta de seguridad.

### 4. TransactionExecutor (El Músculo)

Si todo es legal:

1.  **Path Security**: Verifica que el archivo del Business Object esté físicamente dentro de la carpeta `BO/` permitida. Bloquea cualquier intento de salir del directorio (`../`).
2.  **Instanciación**: Carga el BO e inyecta dependencias (`db`, `logger`, `validator`).
3.  **Ejecución**: Llama al método solicitado.

### 5. Auditoría

El orquestador registra el resultado final (éxito o error) en el servicio de auditoría, garantizando trazabilidad completa.
