# Business Objects (BO): Anatomía del Negocio

El Business Object (BO) es la clase suprema en nuestra arquitectura. Es donde tu código "hace cosas".

## Anatomía de un BO

Todo BO debe heredar de `BaseBO`. Esto le da superpoderes (acceso a DB, Logger, Config, etc.) y métodos de ejecución estandarizados.

```typescript
import { BaseBO, BODependencies } from '../../src/core/business-objects/BaseBO.js'
import { UserSchemas, CreateUserInput } from './User.Schemas.js'
import { UserService } from './User.Service.js'

export class UserBO extends BaseBO {
    private service: UserService

    constructor(deps?: BODependencies) {
        super(deps)
        this.service = new UserService(this.log, this.config, this.db)
    }

    // Método Estándar
    async createUser(params: CreateUserInput): Promise<ApiResponse> {
        return this.exec<CreateUserInput, void>(params, UserSchemas.create, async (data) => {
            // 'data' ya está validada aquí
            await this.service.create(data)
            return this.created(null, 'Usuario Creado')
        })
    }
}
```

## El Patrón `.exec()`

En lugar de escribir bloques repetitivos `try/catch` y `validate`, usa `this.exec()`.

**Maneja por ti**:

1. **Validación**: Verifica `params` contra el schema Zod. Retorna 400 si es inválido.
2. **Ejecución**: Corre tu función callback.
3. **Manejo de Errores**: Captura errores, verifica si son `BOError` y devuelve los códigos 4xx/500 apropiados.

## Herramientas Inyectadas

Dentro de un BO, tienes acceso a:

| Propiedad     | Tipo        | Descripción                   |
| :------------ | :---------- | :---------------------------- |
| `this.db`     | `IDatabase` | Acceso directo a Postgres.    |
| `this.log`    | `ILogger`   | Logger estructurado.          |
| `this.config` | `IConfig`   | Variables de entorno tipadas. |

## CrudBO: Desarrollo Rápido

Para recursos CRUD estándar, extiende `CrudBO`.

```typescript
export class ProductBO extends CrudBO<Product, CreateProduct, UpdateProduct> {
    constructor(deps?: BODependencies) {
        super('products', 'product_id', deps) // Tabla, columna ID
    }

    // Auto-genera: get, list, delete.
    // Solo implementas métodos especializados.
}
```

## Servicios y BOError

Para mantener el código limpio:

- **BO**: Orquesta (HTTP -> BO -> Service).
- **Service**: Extiende `BOService`. Contiene lógica de negocio pura.
- **BOError**: Úsalo para errores de dominio.

```typescript
// Service
import { BOService } from '../../src/core/business-objects/BOService.js'

export class UserService extends BOService {
    async create(data: UserData) {
        if (await this.repo.exists(data.email)) {
            throw new UserAlreadyExistsError() // Extiende BOError
        }
        // ...
    }
}
```
