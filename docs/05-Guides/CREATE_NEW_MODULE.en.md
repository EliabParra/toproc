# Master Tutorial: Creating a BO from Zero to Hero

This tutorial walks you through creating a complete feature.
**Goal**: Create a "Discount Coupons" (`Coupons`) module.

---

## Step 1: Auto Generation

Don't waste time creating folders.

```bash
npm run bo new Coupons --methods "create,validate"
```

This creates:

- `BO/Coupons/CouponsBO.ts`
- `BO/Coupons/CouponsService.ts`
- `BO/Coupons/CouponsRepository.ts`
- `BO/Coupons/schemas.ts`

---

## Step 2: The Contract (Schemas)

First define data. Open `BO/Coupons/schemas.ts`.

```typescript
import { z } from 'zod'

export const CreateCouponSchema = z.object({
    code: z.string().min(3).uppercase(), // "SUMMER2024"
    discount: z.number().min(1).max(100), // % Discount
    expires_at: z.string().datetime(), // ISO Date
})

export const ValidateCouponSchema = z.object({
    code: z.string(),
})
```

---

## Step 3: Data Access (Repository)

How do we save this? Open `CouponsRepository.ts`.

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

## Step 4: Business Logic (Service)

Intelligence lives here. Open `CouponsService.ts`.

```typescript
export class CouponsService {
    constructor(private repo: CouponsRepository) {}

    async create(data: any) {
        // Rule: No duplicates
        const exists = await this.repo.findByCode(data.code)
        if (exists) throw new Error('Coupon already exists')

        return this.repo.create(data)
    }

    async validate(code: string) {
        const coupon = await this.repo.findByCode(code)
        if (!coupon) throw new Error('Invalid coupon')

        if (new Date() > new Date(coupon.expires_at)) {
            throw new Error('Coupon expired')
        }
        return coupon
    }
}
```

---

## Step 5: The Controller (BO)

Connect everything. Open `CouponsBO.ts`.

```typescript
export class CouponsBO extends BaseBO {
    // ... constructor ...

    async create(params: unknown) {
        // 1. Validate Input
        const input = this.validate(params, CreateCouponSchema)
        if (!input.ok) return this.validationError(input.alerts)

        try {
            // 2. Execute Logic
            const result = await this.service.create(input.data)
            // 3. Respond
            return this.created(result)
        } catch (e: any) {
            // 4. Handle "Expected" Error
            return this.error(e.message, 409) // Conflict
        }
    }
}
```

## Step 6: The Final Touch (Permissions)

Right now, no one can execute this. You need to give it an ID (tx).

1.  Open your database (or SQL script).
2.  Insert into `security.transactions`:
    - mapping: `1001` -> `Coupons.create`
3.  Insert into `security.permissions`:
    - `tx: 1001`, `profile_id: 1` (Admin)

Done! Do `POST /toProccess` with `{ tx: 1001, data: { ... } }`.
