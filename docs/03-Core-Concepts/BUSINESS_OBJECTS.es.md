# Business Objects (BO): La Anatomía del Negocio

El Business Object (BO) es la clase suprema en nuestra arquitectura. Es donde tu código "hace cosas".

## Anatomía de un BO

Todo BO debe heredar de `BaseBO`. Esto le da superpoderes (acceso a DB, Logger, Config, etc.) sin tener que importarlos manualmente.

```typescript
import { BaseBO, BODependencies } from '../../core/base/BaseBO'
import { UserSchema } from './schemas'

export class UserBO extends BaseBO {
    constructor(deps: BODependencies) {
        // Al llamar super(deps), inyectamos todas las herramientas automáticamente
        super(deps)
    }

    // Este método se convertirá en una Transacción (ej. tx: 101)
    async createUser(params: unknown) {
        // ... lógica ...
    }
}
```

## Las Herramientas Inyectadas (`this`)

Al estar dentro de un BO, tienes acceso inmediato a:

| Propiedad     | Tipo           | Descripción                   | Ejemplo de Uso           |
| :------------ | :------------- | :---------------------------- | :----------------------- |
| `this.db`     | `IDatabase`    | Acceso directo a Postgres.    | `await this.db.exe(...)` |
| `this.log`    | `ILogger`      | Logger estructurado.          | `this.log.info('Hola')`  |
| `this.config` | `IConfig`      | Variables de entorno tipadas. | `this.config.app.port`   |
| `this.v`      | `AppValidator` | Validador Zod.                | `this.validate(...)`     |
| `this.i18n`   | `I18nService`  | Traducciones.                 | `this.i18n.t('hello')`   |

## Patrón de Respuesta Estandarizado

Nunca, bajo ninguna circunstancia, escribas `res.send(...)` dentro de un BO.
Un BO no sabe que existe HTTP. En su lugar, el BO **retorna** un objeto de respuesta uniforme.

### 1. `this.success(data, msg?)`

Retorna código `200`. Úsalo para GET, PUT, DELETE exitosos.

```typescript
return this.success({ id: 5 }, 'Usuario Encontrado')
// Genera: { ok: true, data: { id: 5 }, msg: 'Usuario Encontrado' }
```

### 2. `this.created(data, msg?)`

Retorna código `201`. Úsalo solo para POST (Creación).

```typescript
return this.created({ id: 6 })
// Genera: { ok: true, data: { id: 6 }, code: 201 }
```

### 3. `this.error(msg, code, alerts?)`

Retorna errores controlados.

```typescript
return this.error('Usuario no activo', 403)
```

### 4. `this.validationError(alerts)`

Retorna código `400` automáticamente.

```typescript
return this.validationError(['El email es inválido'])
```

---

## Servicios y Repositorios

Para mantener el BO limpio (Clean Code), se recomienda separar responsabilidades:

- **BO**: Solo Valida y Orquesta.
- **Service**: Contiene la lógica compleja (if/else, cálculos).
- **Repository**: Solo toca SQL.

```typescript
// BO
const data = this.validate(params, schema).data;
this.service.calcularImpuestos(data);

// Service
calcularImpuestos(data) { return data.price * 1.16; }
```
