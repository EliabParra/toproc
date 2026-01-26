# Tutorial: Crear un Nuevo Módulo (Business Object)

Vamos a crear un módulo de ejemplo: **"Tickets"** (para un sistema de soporte).

## 1. Generar Estructura

Usa la herramienta CLI para ahorrar tiempo.

```bash
npm run bo new Tickets
```

Esto crea la carpeta `BO/Tickets` con:

- `TicketsBO.ts`
- `TicketsService.ts`
- `TicketsRepository.ts`
- `schemas.ts`

## 2. Definir Datos (Schemas)

Edita `BO/Tickets/schemas.ts`. Vamos a necesitar un título y una descripción.

```typescript
import { z } from 'zod'

export const CreateTicketSchema = z.object({
    title: z.string().min(5),
    description: z.string(),
})
```

## 3. Implementar Repositorio (Data)

Edita `TicketsRepository.ts`. Necesitamos guardar en la tabla.

```typescript
async insert(data: any) {
    const sql = `INSERT INTO tickets (title, description) VALUES ($1, $2) RETURNING id`;
    const res = await this.db.exe(sql, [data.title, data.description]);
    return res[0];
}
```

## 4. Implementar Servicio (Lógica)

Edita `TicketsService.ts`. Quizás queremos asegurarnos que el título no sea ofensivo.

```typescript
async create(data: any) {
    if (data.title.includes('grocera')) throw new Error('Lenguaje inapropiado');
    return this.repo.insert(data);
}
```

## 5. Exponer en BO (API)

Edita `TicketsBO.ts`. Conecta todo.

```typescript
// Importa el schema
import { CreateTicketSchema } from './schemas';

async createTicket(params: unknown) {
    // 1. Validar
    const v = this.validate(params, CreateTicketSchema);
    if (!v.ok) return this.validationError(v.alerts);

    // 2. Llamar servicio
    const result = await this.service.create(v.data);

    // 3. Responder
    return this.created(result);
}
```

## 6. Registrar Transacción

Para que esto funcione, debes asignarle un ID (`tx`).
Edita tu mapa de transacciones (usualmente en base de datos o archivo `transaction-map`):

- `tx: 901` -> `Tickets.createTicket`

¡Listo! Ahora puedes llamar a `POST /toProccess` con `{ tx: 901, ... }`.
