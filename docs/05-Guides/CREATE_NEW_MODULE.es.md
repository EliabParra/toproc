# Tutorial Maestro: Creando un BO de Cero a Héroe

Este tutorial te llevará de la mano para crear una funcionalidad completa.
**Objetivo**: Crear un módulo de "Cupones de Descuento" (`Coupons`).

---

## Paso 1: Generación Automática

No pierdas tiempo creando carpetas.

```bash
pnpm run bo new Coupons --methods "create,validate"
```

Esto crea:

- `BO/Coupons/CouponsBO.ts`
- `BO/Coupons/CouponsService.ts`
- `BO/Coupons/CouponsRepository.ts`
- `BO/Coupons/CouponsSchemas.ts`
- `BO/Coupons/CouponsTypes.ts`
- `BO/Coupons/CouponsMessages.ts`
- `BO/Coupons/CouponsErrors.ts`
- `BO/Coupons/CouponsQueries.ts`
- `BO/Coupons/CouponsModule.ts`

---

## Paso 2: El Contrato (Schemas)

Primero definimos datos y mensajes de validación. Abre `BO/Coupons/CouponsSchemas.ts`.

```typescript
import { z } from 'zod'
import { CouponsMessages } from './CouponsMessages.js'

export type CouponsMessagesSet = typeof CouponsMessages.es

export const createCouponsSchemas = (messages: CouponsMessagesSet = CouponsMessages.es) => {
    const validation = messages.validation ?? CouponsMessages.es.validation

    return {
        create: z.object({
            code: z.string().min(3, validation.codeRequired).toUpperCase(),
            discount: z.number().min(1, validation.discountMin).max(100, validation.discountMax),
            expiresAt: z.string().datetime(validation.expiresAtInvalid),
        }),

        validate: z.object({
            code: z.string().min(1, validation.codeRequired),
        }),
    }
}

export const CouponsSchemas = createCouponsSchemas(CouponsMessages.es)

export type CreateInput = z.infer<typeof CouponsSchemas.create>
export type ValidateInput = z.infer<typeof CouponsSchemas.validate>
```

---

## Paso 3: Acceso a Datos (Repository)

¿Cómo guardamos esto? Abre `CouponsRepository.ts`.

```typescript
import { IDatabase } from '../../src/core/business-objects/index.js'
import { CouponsQueries, Types } from './CouponsModule.js'

export class CouponsRepository implements Types.ICouponsRepository {
    constructor(private db: IDatabase) {}

    async create(data: Partial<Types.Coupon>): Promise<Types.Coupon | null> {
        const result = await this.db.query<Types.Coupon>(CouponsQueries.create, [
            data.code,
            data.discount,
            data.expiresAt,
        ])
        return result.rows[0] ?? null
    }

    async findByCode(code: string): Promise<Types.Coupon | null> {
        const result = await this.db.query<Types.Coupon>(CouponsQueries.findByCode, [code])
        return result.rows[0] ?? null
    }
}
```

---

## Paso 4: Lógica de Negocio (Service)

Aquí vive la inteligencia. Abre `CouponsService.ts`.

```typescript
import { BOService, IConfig, IDatabase } from '../../src/core/business-objects/index.js'
import type { ILogger } from '../../src/types/core.js'
import { CouponsRepository, Errors, Types } from './CouponsModule.js'

export class CouponsService extends BOService implements Types.ICouponsService {
    constructor(
        private repo: CouponsRepository,
        log: ILogger,
        config: IConfig,
        db: IDatabase
    ) {
        super(log, config, db)
    }

    async create(data: Types.CreateCouponData): Promise<Types.Coupon> {
        // Regla: No duplicados
        const exists = await this.repo.findByCode(data.code)
        if (exists) throw new Errors.CouponAlreadyExistsError(data.code)

        const created = await this.repo.create(data)
        if (!created) throw new Errors.CouponCreateError()
        return created
    }

    async validate(code: string): Promise<Types.Coupon> {
        const coupon = await this.repo.findByCode(code)
        if (!coupon) throw new Errors.CouponNotFoundError(code)

        if (new Date() > new Date(coupon.expiresAt)) {
            throw new Errors.CouponExpiredError(code)
        }
        return coupon
    }
}
```

---

## Paso 5: El Controlador (BO)

Conecta todo. Abre `CouponsBO.ts`.

```typescript
import { BaseBO, BODependencies, ApiResponse } from '../../src/core/business-objects/index.js'
import {
    CouponsRepository,
    CouponsService,
    CouponsMessages,
    createCouponsSchemas,
    Schemas,
} from './CouponsModule.js'
import type { Types } from './CouponsModule.js'

export class CouponsBO extends BaseBO {
    private service: CouponsService

    constructor(deps: BODependencies) {
        super(deps)
        const repo = new CouponsRepository(this.db)
        this.service = new CouponsService(repo, this.log, this.config, this.db)
    }

    private get couponsMessages() {
        return this.i18n.use(CouponsMessages)
    }

    private get couponsSchemas() {
        return createCouponsSchemas(this.couponsMessages)
    }

    async create(params: Schemas.CreateInput): Promise<ApiResponse> {
        return this.exec<Schemas.CreateInput, Types.Coupon>(
            params,
            this.couponsSchemas.create,
            async (data) => {
                const result = await this.service.create(data)
                return this.created(result, this.couponsMessages.createSuccess)
            }
        )
    }
}
```

## Paso 6: El Toque Final (Permisos)

Ahora mismo, nadie puede ejecutar esto. Necesitas darle un ID (tx).

1.  Abre tu base de datos (o script SQL).
2.  Inserta en `security.transactions`:
    - mapping: `1001` -> `Coupons.create`
3.  Inserta en `security.permissions`:
    - `tx: 1001`, `profile_id: 1` (Admin)

¡Listo! Haz `POST /toProccess` con `{ tx: 1001, params: { ... } }`.
