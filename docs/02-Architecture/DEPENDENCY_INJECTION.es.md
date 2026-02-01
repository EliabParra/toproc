# Inyección de Dependencias y Lazy Loading

Explicación técnica de cómo el framework gestiona las dependencias de los Business Objects.

## Arquitectura de Dependencias

### Interfaz `BODependencies`

Todos los Business Objects reciben sus dependencias a través de una interfaz tipada:

```typescript
// src/types/core.ts
export interface BODependencies {
    db: IDatabase
    log: ILogger
    config: IConfig
    audit: IAuditService
    security: ISecurityService
    session: ISessionService
    v: IValidator
    i18n: II18nService
}
```

### Clase Base `BaseBO`

Los Business Objects extienden `BaseBO`, que provee acceso tipado a todas las dependencias:

```typescript
// src/core/business-objects/BaseBO.ts
export class BaseBO {
    protected readonly db: IDatabase
    protected readonly log: ILogger
    protected readonly config: IConfig
    protected readonly v: IValidator
    protected readonly i18n: II18nService
    // ... otras dependencias

    constructor(deps: BODependencies) {
        this.db = deps.db
        this.log = deps.log
        // ... asignación de dependencias
    }
}
```

## Flujo de Inyección

```
┌──────────────┐     ┌───────────┐     ┌───────────────────────┐
│  foundation  │────▶│ AppServer │────▶│ TransactionController │
│   (crear)    │     │  (setup)  │     │       (HTTP)          │
└──────────────┘     └───────────┘     └───────────────────────┘
                                                   │
                                                   ▼
┌───────────────────────┐     ┌────────────────────┐
│  TransactionExecutor  │◀────│   SecurityService  │
│   (import dinámico)   │     │    (orquestar)     │
└───────────────────────┘     └────────────────────┘
            │
            ▼
  ┌─────────────────────┐
  │   Business Object   │
  │  (BODependencies)   │
  └─────────────────────┘
```

1. **foundation.ts**: Crea dependencias core (`db`, `log`) y `SecurityService`.
2. **AppServer**: Recibe `SecurityService` y lo inyecta en `TransactionController`.
3. **TransactionController**: Maneja la petición e invoca `SecurityService.executeMethod()`.
4. **TransactionExecutor**: Importa dinámicamente el BO y lo instancia.
5. **Business Object**: Recibe dependencias tipadas en su constructor.

## Lazy Loading (Carga Perezosa)

Los Business Objects se cargan bajo demanda para optimizar el tiempo de arranque.

### Implementación (`TransactionExecutor.ts`)

```typescript
async execute(objectName: string, methodName: string, params: unknown) {
    // 1. Construir ruta del módulo
    const modulePath = `../../BO/${objectName}/${objectName}BO.js`

    // 2. Import dinámico (solo cuando se necesita)
    const module = await import(modulePath)
    const BOClass = module[`${objectName}BO`]

    // 3. Instanciar con dependencias completas
    const instance = new BOClass(this.deps)

    // 4. Ejecutar método
    return instance[methodName](params)
}
```

### Caché de Instancias

El `TransactionExecutor` cachea instancias de BOs por sesión para evitar reimportaciones:

```typescript
private boCache = new Map<string, BaseBO>()

async getBO(objectName: string): Promise<BaseBO> {
    if (!this.boCache.has(objectName)) {
        const instance = await this.importBO(objectName)
        this.boCache.set(objectName, instance)
    }
    return this.boCache.get(objectName)!
}
```

## Ventajas

| Característica      | Beneficio                                             |
| ------------------- | ----------------------------------------------------- |
| **Tipado Estricto** | Sin contenedores `any`. Dependencias explícitas.      |
| **Testabilidad**    | Fácil mockeo de `db`, `log`, etc. en tests unitarios. |
| **Inicio Rápido**   | Servidor arranca en milisegundos.                     |
| **Aislamiento**     | Error en un BO no afecta otros hasta ser invocado.    |
| **Eficiencia**      | Memoria asignada solo para contextos activos.         |

## Ver También

- [Bootstrap](./BOOTSTRAP.es.md) - Proceso de inicialización
- [AppServer Core](./APPSERVER_CORE.es.md) - Funcionamiento del servidor HTTP
- [Sistema de Seguridad](./SECURITY_SYSTEM.es.md) - Permisos y transacciones
