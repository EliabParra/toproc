# Guía de Testing: Tests Nativos

Usamos el **Node.js Test Runner** nativo (`node:test`). Es rápido, simple y no requiere instalar Jest o Mocha.

## Estructura de un Test

Crea un archivo `BO/Coupons/test/CouponsService.test.ts`.

```typescript
import { describe, it, before, mock } from 'node:test' // Nativo!
import assert from 'node:assert/strict'

import { CouponsService } from '../CouponsService'

describe('Coupons Logic', () => {
    let service: CouponsService
    let mockRepo: any

    before(() => {
        // 1. Crear Mock (Simulación) del Repositorio
        // No queremos tocar la DB real
        mockRepo = {
            findByCode: mock.fn(),
            create: mock.fn(),
        }

        const mockLog = { info: () => {} }
        const mockConfig = {}
        const mockDb = {}

        service = new CouponsService(mockRepo, mockLog as any, mockConfig as any, mockDb as any)
    })

    it('debería rechazar cupones duplicados', async () => {
        // Simulamos que findByCode devuelve algo (existe)
        mockRepo.findByCode.mock.mockImplementation(() => Promise.resolve({ id: 1 }))

        await assert.rejects(async () => await service.create({ code: 'TEST' }), {
            message: 'El cupón ya existe',
        })
    })

    it('debería crear si no existe', async () => {
        // Simulamos que no existe (null)
        mockRepo.findByCode.mock.mockImplementation(() => Promise.resolve(null))
        mockRepo.create.mock.mockImplementation(() => Promise.resolve({ id: 99 }))

        const res = await service.create({ code: 'NEW' })
        assert.equal(res.id, 99)
    })
})
```

## Comandos

- **Todos los tests**: `pnpm test`
- **Solo un archivo**: `node --import tsx --test BO/Coupons/test/CouponsService.test.ts`
- **Con Cobertura**: `pnpm run test:coverage` (te dice qué % de código está probado).
