# Validation

Never trust what the user sends. Ever.

## AppValidator and Zod

We use a library called **Zod** to define "schemas" of what data should look like. Our `AppValidator` wraps Zod to make it easier.

### 1. Define the Schema (`schemas.ts`)

```typescript
import { z } from 'zod'

export const LoginSchema = z.object({
    email: z.string().email(), // Must be text and look like an email
    password: z.string().min(8), // Min 8 chars
    age: z.number().optional(), // Number, but not required
})
```

### 2. Use validation in your BO

All BOs have access to the `this.validate()` method.

```typescript
// AuthBO.ts
import { LoginSchema } from './schemas';

async login(params: unknown) {
    // Validate 'params' against 'LoginSchema'
    const v = this.validate(params, LoginSchema);

    // If failed, 'v.ok' is false and 'v.alerts' has the errors explained
    if (!v.ok) {
        return this.validationError(v.alerts);
    }

    // If passed, 'v.data' has clean, typed data
    const { email, password } = v.data;
    return this.service.login(email, password);
}
```

## Why this way?

- **Security**: Zod strips any extra fields a hacker user tries to send.
- **Cleanliness**: You execute knowing `email` is actually an email.
- **Typing**: TypeScript automatically knows the type of `v.data`.
