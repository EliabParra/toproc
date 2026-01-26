# Testing

Dormir tranquilo es fácil si tienes tests.

## Tipos de Test

1.  **Test Unitarios**: Prueban una sola pieza (e.g., solo el Servicio sin base de datos real).
2.  **Test de Integración**: Prueban todo junto (e.g., llamando al endpoint HTTP y viendo que se guarde en DB).

## Correr Tests

```bash
npm test
```

## Escribiendo un Test (Ejemplo)

Usamos **Mocha** y **Chai** (o similar según configuración).

```typescript
import { expect } from 'chai'
import { TicketsService } from '../src/BO/Tickets/TicketsService'

describe('Tickets Service', () => {
    it('debería rechazar palabras groseras', async () => {
        const service = new TicketsService(mockContainer)

        try {
            await service.create({ title: 'palabra grosera' })
            throw new Error('Debió fallar')
        } catch (e) {
            expect(e.message).to.equal('Lenguaje inapropiado')
        }
    })
})
```
