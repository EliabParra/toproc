# Business Objects (BO): Anatomía del Negocio

El Business Object (BO) es la clase suprema en nuestra arquitectura. Es donde tu código "hace cosas".

## Anatomía de un BO

Todo BO debe heredar de `BaseBO`. Esto le da superpoderes (acceso a DB, Logger, Config, Validator, etc.) y métodos de ejecución estandarizados.

```typescript
import { BaseBO, BODependencies } from '../../src/core/business-objects/index.js'
import { UserRepository, UserService, UserMessages, createUserSchemas } from './UserModule.js'
import type { CreateUserInput } from './UserModule.js'

export class UserBO extends BaseBO {
    private service: UserService

    constructor(deps: BODependencies) {
        super(deps)
        const repo = new UserRepository(this.db)
        this.service = new UserService(repo, this.log, this.config, this.db)
    }

    // Accessor tipado para mensajes i18n
    private get m() {
        return this.i18n.use(UserMessages)
    }

    private get schemas() {
        return createUserSchemas(this.m)
    }

    // Método Estándar
    async create(params: CreateUserInput): Promise<ApiResponse> {
        return this.exec<CreateUserInput, void>(params, this.schemas.create, async (data) => {
            await this.service.create(data)
            return this.created(null, this.m.createSuccess) // ← Mensaje tipado
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

| Propiedad        | Tipo           | Descripción                       |
| :--------------- | :------------- | :-------------------------------- |
| `this.db`        | `IDatabase`    | Acceso directo a Postgres.        |
| `this.log`       | `ILogger`      | Logger estructurado.              |
| `this.config`    | `IConfig`      | Variables de entorno tipadas.     |
| `this.i18n`      | `II18nService` | Servicio de internacionalización. |
| `this.validator` | `IValidator`   | Servicio de validación (Zod).     |
| `this.m`         | (getter)       | Mensajes tipados del BO actual.   |

## Estructura de 9 Archivos

Cada BO genera **9 archivos** con la nomenclatura `{Nombre}{Tipo}.ts`:

```
BO/User/
├── 📦 UserBO.ts            # Business Object (archivo principal)
├── 🧠 UserService.ts       # Lógica de negocio
├── 🗄️ UserRepository.ts    # Acceso a base de datos
├── 🔍 UserQueries.ts       # SQL colocalizado
├── ✅ UserSchemas.ts        # Validaciones Zod
├── 📘 UserTypes.ts          # Interfaces TypeScript
├── 💬 UserMessages.ts       # Strings i18n (ES/EN)
├── ❌ UserErrors.ts         # Clases de error personalizadas
└── 📦 UserModule.ts         # Barril de exportaciones
```

## Servicios y BOError

Para mantener el código limpio:

- **BO**: Orquesta (HTTP -> BO -> Service).
- **Service**: Extiende `BOService`. Contiene lógica de negocio pura.
- **Repository**: Usa `db.query<T>` con tipos y SQL colocalizado.
- **BOError**: Úsalo para errores de dominio.

```typescript
// Repository
import { IDatabase } from '../../src/types/core.js'
import { UserQueries } from './UserQueries.js'
import { User } from './UserTypes.js'

export class UserRepository {
    constructor(private db: IDatabase) {}

    async findById(id: number): Promise<User | null> {
        const result = await this.db.query<User>(UserQueries.findById, [id])
        return result.rows[0] ?? null
    }
}
```

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
