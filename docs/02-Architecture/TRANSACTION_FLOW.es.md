# Flujo de Transacción (Transaction Flow)

Cada vez que alguién hace click en tu aplicación, ocurre un viaje fascinante. Aquí te explicamos el ciclo de vida de una petición.

## Diagrama de Secuencia

```mermaid
sequenceDiagram
    participant User as Usuario
    participant Express as Servidor Web
    participant Dispatcher as Dispatcher (Core)
    participant Security as Seguridad
    participant BO as Business Object

    User->>Express: POST /toProccess { tx: 101, data: ... }
    Express->>Dispatcher: processRequest()

    Dispatcher->>Security: ¿Tiene permiso para tx 101?

    alt Sin Permiso
        Security-->>Dispatcher: NO (Error 403)
        Dispatcher-->>User: Error: Acceso Denegado
    else Con Permiso
        Security-->>Dispatcher: SÍ
        Dispatcher->>BO: Instanciar BO correspondiente
        Dispatcher->>BO: execute(data)

        BO->>BO: Validar Datos (Zod)
        BO->>BO: Ejecutar Lógica

        BO-->>Dispatcher: Resultado Exitoso
        Dispatcher-->>User: JSON { ok: true, data: ... }
    end
```

## Paso a Paso

1.  **Entrada**:
    Todo entra por un solo endpoint: `/toProccess`. Esto simplifica el manejo de errores y seguridad.

2.  **Identificación (`tx`)**:
    El cliente envía un código de transacción (`tx`). Ejemplo: `100` para Login, `200` para Crear Usuario.

3.  **Seguridad**:
    Antes de ejecutar nada, el sistema verifica:
    - ¿Quién es el usuario? (Sesión/Token)
    - ¿Ese usuario tiene permiso para ejecutar la `tx: 100`?

4.  **Despacho (Dispatch)**:
    Si hay permiso, el `Dispatcher` busca en su mapa de transacciones qué código (BO) debe ejecutarse.

5.  **Ejecución**:
    Se "despierta" al Business Object, este valida los datos y hace su magia.

6.  **Respuesta**:
    El sistema devuelve siempre un formato estándar JSON.
