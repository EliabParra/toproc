# Arquitectura General (Overview)

Nuestro sistema sigue una versión pragmática de **Clean Architecture**. El objetivo es separar las responsabilidades para que el código sea mantenible.

## Diagrama de Capas

```mermaid
graph TD
    Client[Cliente] -->|HTTP| API[Capa API (Express)]
    API -->|Despacha| Core[Capa Core (Dispatcher/Security)]
    Core -->|Ejecuta| BO[Business Objects (Lógica)]
    BO -->|Usa| Infra[Capa Infraestructura (DB/Email)]

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

## Las 4 Capas Principales

1.  **Capa API (`src/api`, `src/express`)**:
    - Es la "puerta de entrada".
    - Recibe peticiones HTTP.
    - No tiene lógica de negocio. Solo "pasa la pelota" al Core.

2.  **Capa Core (`src/core`)**:
    - Es el "cerebro administrativo".
    - `SecurityService`: Verifica permisos.
    - `Dispatcher`: Decide a quién llamar.
    - Garantiza que NADIE entre sin permiso.

3.  **Business Objects (`BO/`)**:
    - Aquí vive TU código.
    - Contiene toda la lógica del negocio (e.g., "Cómo crear un producto").
    - Validación de datos (Zod).

4.  **Capa Infraestructura (`src/db`, `src/infra`)**:
    - Son los "servicios técnicos".
    - Base de Datos, Email, Logs.
    - Los BOs usan estos servicios, pero no saben cómo funcionan por dentro.

## ¿Por qué así?

Si mañana cambiamos PostgreSQL por MySQL, solo tocamos la Capa de Infraestructura. Tu lógica de negocio (`BO/`) no se entera ni se rompe.
