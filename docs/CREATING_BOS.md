# Crear Business Objects (BOs)

Esta guía explica cómo crear nuevos Business Objects usando el CLI incluido.

## Usando el CLI

El comando más simple para crear un nuevo BO:

```bash
npm run bo Product
```

Esto genera la siguiente estructura:

```
src/BO/Product/
├── schemas.ts      # Esquemas Zod para validación
├── repository.ts   # Acceso a base de datos
├── service.ts      # Lógica de negocio
└── index.ts        # Business Object principal
```

---

## Archivos Generados

### 1. schemas.ts

Define los esquemas de validación usando Zod:

```typescript
import { z } from 'zod'

/**
 * Esquema para obtener un Product por ID.
 */
export const GetProductSchema = z.object({
    id: z.number().int().positive(),
})

/**
 * Esquema para crear un nuevo Product.
 */
export const CreateProductSchema = z.object({
    // Agregar campos requeridos aquí
})

// Tipos inferidos de los esquemas
export type GetProductInput = z.infer<typeof GetProductSchema>
export type CreateProductInput = z.infer<typeof CreateProductSchema>
```

### 2. repository.ts

Capa de acceso a datos:

```typescript
import { IDatabase } from '../../types/core.js'

export class ProductRepository {
    constructor(private db: IDatabase) {}

    async getById(id: number) {
        const result = await this.db.exe('product', 'getById', [id])
        return result.rows[0] ?? null
    }

    async create(data: CreateProductInput) {
        const result = await this.db.exe('product', 'create', [data.name, data.price])
        return result.rows[0]
    }
}
```

### 3. service.ts

Lógica de negocio:

```typescript
import { ProductRepository } from './repository.js'

export class ProductService {
    constructor(private repo: ProductRepository) {}

    async get(id: number) {
        return this.repo.getById(id)
    }

    async create(data: CreateProductInput) {
        // Validaciones de negocio aquí
        return this.repo.create(data)
    }
}
```

### 4. index.ts (Business Object)

El BO principal que conecta todo:

```typescript
import { BaseBO, BODependencies, ApiResponse } from '../../core/base/BaseBO.js'
import { GetProductSchema, CreateProductSchema } from './schemas.js'
import { ProductRepository } from './repository.js'
import { ProductService } from './service.js'

export default class ProductBO extends BaseBO {
    private service: ProductService

    constructor(deps: BODependencies) {
        super(deps)
        const repo = new ProductRepository(deps.db)
        this.service = new ProductService(repo)
    }

    async get(params: unknown): Promise<ApiResponse> {
        const parsed = this.validate(params, GetProductSchema)
        if (!parsed.ok) return this.validationError(parsed.alerts)

        const product = await this.service.get(parsed.data.id)
        if (!product) return this.error('Producto no encontrado', 404)

        return this.success(product)
    }

    async create(params: unknown): Promise<ApiResponse> {
        const parsed = this.validate(params, CreateProductSchema)
        if (!parsed.ok) return this.validationError(parsed.alerts)

        const product = await this.service.create(parsed.data)
        return this.created(product)
    }
}
```

---

## Registrar Transacciones

Después de crear el BO, debes registrar sus transacciones en `src/transactionMap.ts`:

```typescript
export const transactionMap: TransactionMap = {
    // ... transacciones existentes

    // Nuevas transacciones para Product
    PRD_GET: {
        bo: 'Product',
        method: 'get',
        profiles: [1, 2, 3], // Perfiles que pueden acceder
    },
    PRD_CREATE: {
        bo: 'Product',
        method: 'create',
        profiles: [1], // Solo admin
    },
}
```

---

## Probar el Nuevo BO

```bash
# Ejecutar tests
npm test

# Verificar todo el proyecto
npm run verify
```

### Llamar la transacción

```bash
curl -X POST http://localhost:3000/toProccess \
  -H "Content-Type: application/json" \
  -H "Cookie: <session-cookie>" \
  -H "X-CSRF-Token: <csrf-token>" \
  -d '{"tx": "PRD_GET", "id": 1}'
```

---

## Mejores Prácticas

### ✅ Hacer

- Usar esquemas Zod para toda la validación de entrada
- Separar lógica en Repository (datos) y Service (negocio)
- Retornar respuestas usando los helpers: `success()`, `error()`, `validationError()`
- Documentar métodos públicos con JSDoc en español

### ❌ Evitar

- Acceder a `this.db` directamente en el BO (usar Repository)
- Validación manual de parámetros (usar Zod)
- Hardcodear mensajes (usar i18n)
- Lógica de negocio en el Repository (pertenece al Service)

---

## Ejemplo Completo

Ver `src/BO/Auth/` para un ejemplo funcional de autenticación con:

- Login/Logout
- Verificación de sesión
- Auditoría
