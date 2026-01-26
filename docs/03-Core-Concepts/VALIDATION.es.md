# Validación (Validation)

Nunca confíes en lo que envía el usuario. Jamás.

## AppValidator y Zod

Usamos una librería llamada **Zod** para definir "esquemas" de cómo deben lucir los datos. Nuestro `AppValidator` envuelve Zod para hacerlo más fácil.

### 1. Defines el Esquema (`schemas.ts`)

```typescript
import { z } from 'zod'

export const LoginSchema = z.object({
    email: z.string().email(), // Debe ser texto y parecer un email
    password: z.string().min(8), // Mínimo 8 caracteres
    age: z.number().optional(), // Número, pero no es obligatorio
})
```

### 2. Usas la validación en tu BO

Todos los BOs tienen acceso al método `this.validate()`.

```typescript
// AuthBO.ts
import { LoginSchema } from './schemas';

async login(params: unknown) {
    // Valida 'params' contra 'LoginSchema'
    const v = this.validate(params, LoginSchema);

    // Si falló, 'v.ok' es falso y 'v.alerts' tiene los errores explicados
    if (!v.ok) {
        return this.validationError(v.alerts);
    }

    // Si pasó, 'v.data' tiene los datos limpios y tipados
    const { email, password } = v.data;
    return this.service.login(email, password);
}
```

## ¿Por qué así?

- **Seguridad**: Zod elimina cualquier campo extra que el usuario hacker intente enviar.
- **Limpieza**: Te aseguras que `email` es realmente un email antes de ensuciar tu lógica.
- **Tipado**: TypeScript sabe automáticamente qué tipo de dato es `v.data`.
