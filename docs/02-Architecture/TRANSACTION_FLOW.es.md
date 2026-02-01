# El Viaje de una Petición (Transaction Flow)

Vamos a analizar microscópicamente qué pasa cuando haces `POST /toProccess`.

## Diagrama de Secuencia Completo

```mermaid
sequenceDiagram
    autonumber
    participant Client
    participant Express as Express (Middleware Chain)
    participant RateLimit
    participant TxCtrl as TransactionController
    participant Security as SecurityService
    participant Audit
    participant BO as BusinessObject

    Note over Client,Express: 1. TCP Connection Handling
    Client->>Express: POST /toProccess { tx: 101, ... }

    Note over Express: Helmet (Headers seguros)<br>RequestId (UUID único)<br>BodyParser (JSON Parse)

    Express->>RateLimit: Check IP Limits
    alt Limit Exceeded
        RateLimit-->>Client: 429 Too Many Requests
    end

    Express->>TxCtrl: handle(req, res)

    TxCtrl->>TxCtrl: Validate JSON Structure (Simple Check)

    Note over TxCtrl,Security: 2. Core Orchestration
    TxCtrl->>Security: isReady?
    TxCtrl->>Security: getDataTx(101) -> resolve mapped BO

    TxCtrl->>Security: getPermissions({ profile: 2, tx: 101 })
    alt Access Denied
        Security-->>TxCtrl: false
        TxCtrl->>Audit: Log "tx_denied"
        TxCtrl-->>Client: 403 Forbidden
    end

    Note over TxCtrl,BO: 3. Business Execution
    TxCtrl->>Security: executeMethod(101)
    Security->>BO: Lazy Load & Instantiate(Container)

    BO->>BO: Validate Params (Zod Schema)
    alt Invalid Params
        BO-->>Security: Validation Error
        Security-->>TxCtrl: Error Response
        TxCtrl-->>Client: 400 Bad Request
    end

    BO->>BO: Run Business Logic (Service/Repo)

    BO-->>Security: Success Result { data: ... }
    Security-->>TxCtrl: Pass Result

    TxCtrl->>Audit: Log "tx_exec" (Success)
    TxCtrl-->>Client: 200 OK { ok: true, data: ... }
```

## Análisis Paso a Paso

### 1. La Cadena de Middlewares (El Filtro)

Antes de que nuestro código "inteligente" toque la petición, Express (configurado por `AppServer`) pasa por varios filtros:

- **Helmet**: Añade headers anti-hacker (X-XSS-Protection, etc).
- **Request ID**: Asigna un ID único (e.g. `req-12345`) a la petición para poder rastrearla en los logs.
- **Request Logger**: Escribe "INCOMING POST /toProccess" en la consola.
- **Rate Limit**: Si esa IP ha hecho 100 peticiones en 1 minuto, la bloquea aquí.

### 2. El TransactionController (El Orquestador)

Solo cuando la petición ha sobrevivido a los filtros, llega al método `handle` del `TransactionController`.

- **Validación Estructural**: Revisa que el JSON tenga `{ tx: number, params: object }`. Si envías basura, te rechaza antes de molestar a la base de datos.
- **Espera Activa**: Si el sistema está arrancando (`security.isReady == false`), espera unos milisegundos antes de fallar.

### 3. Seguridad y Auditoría

- **Resolución**: Convierte `tx: 101` en `AuthBO.login`.
- **Permisos**: Consulta la matriz en memoria (cargada al inicio). Es extremadamente rápido (nanosegundos).
- **Audit**: Si fallas, queda registrado en `audit_log` con tu IP, usuario, y razón del rechazo.

### 4. Ejecución del Negocio

El BO se instancia al momento (Lazy Load) a través del `SecurityService`.

- Recibe el `Container` con la conexión DB ya abierta.
- Valida semánticamente los datos (e.g., "El email tiene formato válido?").
- Ejecuta la tarea.

### 5. Respuesta

El `TransactionController` captura el resultado, lo envuelve y lo envía.
Finalmente, registra "OUTGOING 200 OK" y el tiempo que tomó (e.g. `45ms`).
