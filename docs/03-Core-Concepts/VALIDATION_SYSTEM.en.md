# Validation System (Validations & Zod)

Validation is the only barrier between chaos and the database.
We use **Zod** deeply integrated into the framework to ensure Strict Typing and Friendly Messages.

## 1. AppValidator (`this.v`)

A smart wrapper over Zod injected into all Business Objects (`BaseBO`).
Don't use `z.parse()` manually. Use `this.v.validate()`.

### Validation Flow

1.  **Input**: Raw user data (`unknown`).
2.  **Parsing**: Zod transforms types (e.g., string "10" -> number 10) if configured.
3.  **Error Handling**: If fails, `AppValidator` intercepts Zod technical error.
4.  **Translation (i18n)**: Maps error code (`invalid_type`) to human message (`Price field is required`).

## 2. Strict Typing (TypeScript Inference)

Zod's superpower is that the Schema IS the Type.

```typescript
import { z } from 'zod';

const UserSchema = z.object({
    name: z.string().min(2),
    age: z.number().optional()
});

async createUser(params: unknown) {
    // TypeScript knows 'params' is garbage here.

    const res = this.validate(params, UserSchema);

    if (!res.ok) {
        // Returns array of translated strings
        return this.validationError(res.alerts);
    }

    // MAGIC: Here "res.data" has autocomplete and guaranteed types
    const cleanData = res.data;
    // cleanData.name (string)
    // cleanData.age (number | undefined)
}
```

## 3. Common Schemas and Transformations

You can (and should) sanitize data while validating.

```typescript
const SearchSchema = z.object({
    // Convert Query Param "page=5" (string) -> 5 (number)
    page: z.string().transform(Number).pipe(z.number().min(1)),

    // Normalize email
    email: z.string().email().toLowerCase().trim(),
})
```
