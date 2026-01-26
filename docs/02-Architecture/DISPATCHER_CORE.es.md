# Dispatcher Core: El Cerebro HTTP

El `Dispatcher` es la única puerta de entrada al sistema. No existe un archivo `routes.ts` gigante.
Toda la lógica de ruteo está centralizada aquí para garantizar consistencia y seguridad.

## Ciclo de Vida de Iniciación (`init()`)

Cuando llamas a `await dispatcher.init()`, suceden estos pasos críticos:

1.  **Carga de Configuración**: Se inyectan las dependencias (`ILogger`, `IConfig`, etc).
2.  **Middlewares de Seguridad**:
    - `Helmet`: Headers HTTP seguros.
    - `CORS`: Control de acceso entre dominios.
    - `RateLimit`: Protección contra fuerza bruta (Login: estricto, API: laxo).
    - `CSRF`: Protección contra Cross-Site Request Forgery (Token en cookie).
3.  **Middlewares de Parseo**:
    - `BodyParser`: JSON estricto. Si envías JSON mal formado, un middleware especial lo captura antes de tirar el servidor.
4.  **Sesiones**: Se "enchufa" el gestor de sesiones (`connect-pg-simple` con Postgres).

## La Ruta Maestra: `/toProccess`

El 99% de tu API ocurre en este endpoint POST.

```typescript
this.app.post(
    '/toProccess',
    rateLimiter, // 1. Evita spam
    csrfProtection, // 2. Valida token CSRF
    this.toProccess // 3. Ejecuta lógica
)
```

### Lógica Interna de `toProccess`

1.  **Validación de Sesión**:
    - ¿Tiene cookie válida? -> Recupera `profile_id`.
    - ¿No tiene cookie? -> Asigna `profile_id` público (configurado en .env).
    - Si la ruta requiere login y no hay sesión, rechaza con `401`.

2.  **Validación de Estructura**:
    - Usa `parseToProccessBody` para asegurar que el JSON tiene `{ tx: number, params: object }`.

3.  **Resolución de Transacción**:
    - Consulta a `SecurityService`: "¿Qué significa tx 1001?".
    - Respuesta: `Auth.login`.

4.  **Verificación de Permisos**:
    - Consulta matriz en memoria: "¿El perfil X puede ejecutar Auth.login?".
    - Si no -> Loguea incidente en Auditoría y responde `403`.

5.  **Ejecución**:
    - Invoca `SecurityService.executeMethod()`.
    - Registra éxito/fracaso en Auditoría.

## Manejo de Errores Global

El Dispatcher envuelve todo en un `try/catch` gigante.

- Si un BO hace `throw new Error('Boom')`:
    - El usuario recibe: `500 Server Error`.
    - El log recibe: `Error: Boom at line 50...` (Stack Trace completo).
- Esto evita la "fuga de información" (Information Leakage) hacia el atacante.
