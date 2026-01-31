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
- `BO/Coupons/schemas.ts`

---

## Paso 2: El Contrato (Schemas)

Primero definimos los datos. Abre `BO/Coupons/schemas.ts`.

```typescript
import { z } from 'zod'

export const CreateCouponSchema = z.object({
    code: z.string().min(3).uppercase(), // "SUMMER2024"
    discount: z.number().min(1).max(100), // % de descuento
    expires_at: z.string().datetime(), // ISO Date
})

export const ValidateCouponSchema = z.object({
    code: z.string(),
})
```

---

## Paso 3: Acceso a Datos (Repository)

¿Cómo guardamos esto? Abre `CouponsRepository.ts`.

```typescript
export class CouponsRepository {
    constructor(private db: IDatabase) {}

    async create(data: any) {
        return this.db.exeNamed('coupons', 'insert', data, ['code', 'discount', 'expires_at'])
    }

    async findByCode(code: string) {
        const res = await this.db.exeRaw('SELECT * FROM coupons WHERE code = $1', [code])
        return res.rows[0] || null
    }
}
```

---

## Paso 4: Lógica de Negocio (Service)

Aquí vive la inteligencia. Abre `CouponsService.ts`.

```typescript
export class CouponsService {
    constructor(private repo: CouponsRepository) {}

    async create(data: any) {
        // Regla: No duplicados
        const exists = await this.repo.findByCode(data.code)
        if (exists) throw new Error('El cupón ya existe')

        return this.repo.create(data)
    }

    async validate(code: string) {
        const coupon = await this.repo.findByCode(code)
        if (!coupon) throw new Error('Cupón inválido')

        if (new Date() > new Date(coupon.expires_at)) {
            throw new Error('Cupón expirado')
        }
        return coupon
    }
}
```

---

## Paso 5: El Controlador (BO)

Conecta todo. Abre `CouponsBO.ts`.

```typescript
export class CouponsBO extends BaseBO {
    // ... constructor ...

    async create(params: unknown) {
        // 1. Validar Entrada
        const input = this.validate(params, CreateCouponSchema)
        if (!input.ok) return this.validationError(input.alerts)

        try {
            // 2. Ejecutar Lógica
            const result = await this.service.create(input.data)
            // 3. Responder
            return this.created(result)
        } catch (e: any) {
            // 4. Manejar Error "Esperado"
            return this.error(e.message, 409) // Conflict
        }
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

¡Listo! Haz `POST /toProccess` con `{ tx: 1001, data: { ... } }`.
