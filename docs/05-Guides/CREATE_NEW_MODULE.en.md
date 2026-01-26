# Tutorial: Create a New Module (Business Object)

Let's create an example module: **"Tickets"** (for a support system).

## 1. Generate Structure

Use the CLI tool to save time.

```bash
npm run bo new Tickets
```

This creates the folder `BO/Tickets` with:

- `TicketsBO.ts`
- `TicketsService.ts`
- `TicketsRepository.ts`
- `schemas.ts`

## 2. Define Data (Schemas)

Edit `BO/Tickets/schemas.ts`. We'll need a title and a description.

```typescript
import { z } from 'zod'

export const CreateTicketSchema = z.object({
    title: z.string().min(5),
    description: z.string(),
})
```

## 3. Implement Repository (Data)

Edit `TicketsRepository.ts`. We need to save to the table.

```typescript
async insert(data: any) {
    const sql = `INSERT INTO tickets (title, description) VALUES ($1, $2) RETURNING id`;
    const res = await this.db.exe(sql, [data.title, data.description]);
    return res[0];
}
```

## 4. Implement Service (Logic)

Edit `TicketsService.ts`. Maybe we want to ensure the title isn't offensive.

```typescript
async create(data: any) {
    if (data.title.includes('badword')) throw new Error('Inappropriate language');
    return this.repo.insert(data);
}
```

## 5. Expose in BO (API)

Edit `TicketsBO.ts`. Connect everything.

```typescript
// Import schema
import { CreateTicketSchema } from './schemas';

async createTicket(params: unknown) {
    // 1. Validate
    const v = this.validate(params, CreateTicketSchema);
    if (!v.ok) return this.validationError(v.alerts);

    // 2. Call service
    const result = await this.service.create(v.data);

    // 3. Respond
    return this.created(result);
}
```

## 6. Register Transaction

For this to work, you must assign it an ID (`tx`).
Edit your transaction map (usually in database or `transaction-map` file):

- `tx: 901` -> `Tickets.createTicket`

Done! Now you can call `POST /toProccess` with `{ tx: 901, ... }`.
