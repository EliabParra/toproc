# Testing

Sleeping soundly is easy if you have tests.

## Test Types

1.  **Unit Tests**: Test a single piece (e.g., just the Service without real DB).
2.  **Integration Tests**: Test everything together (e.g., calling the HTTP endpoint and checking DB).

## Running Tests

```bash
npm test
```

## Writing a Test (Example)

We use **Mocha** and **Chai** (or similar depending on config).

```typescript
import { expect } from 'chai'
import { TicketsService } from '../src/BO/Tickets/TicketsService'

describe('Tickets Service', () => {
    it('should reject bad words', async () => {
        const service = new TicketsService(mockContainer)

        try {
            await service.create({ title: 'badword' })
            throw new Error('Should have failed')
        } catch (e) {
            expect(e.message).to.equal('Inappropriate language')
        }
    })
})
```
