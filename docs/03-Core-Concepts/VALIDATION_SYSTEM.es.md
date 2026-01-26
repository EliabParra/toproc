# Sistema de Validación (Validations & Zod)

La validación es la única barrera entre el caos y la base de datos.
Utilizamos **Zod** integrado profundamente en el framework para garantizar Tipado Estricto y Mensajes Amigables.

## 1. AppValidator (`this.v`)

Es un wrapper inteligente sobre Zod inyectado en todos los Business Objects (`BaseBO`).
No uses `z.parse()` manualmente. Usa `this.v.validate()`.

### Flujo de Validación

1.  **Input**: Datos crudos del usuario (`unknown`).
2.  **Parsing**: Zod transforma tipos (ej. string "10" -> number 10) si se configura.
3.  **Error Handling**: Si falla, `AppValidator` intercepta el error técnico de Zod.
4.  **Traducción (i18n)**: Mapea el código de error (`invalid_type`) a un mensaje humano (`El campo precio es requerido`).

## 2. Tipado Estricto (TypeScript Inference)

El mayor superpoder de Zod es que el Schema ES el Tipo.

```typescript
import { z } from 'zod';

const UserSchema = z.object({
    name: z.string().min(2),
    age: z.number().optional()
});

async createUser(params: unknown) {
    // TypeScript sabe que 'params' es basura aquí.

    const res = this.validate(params, UserSchema);

    if (!res.ok) {
        // Devuelve array de strings traducidos
        return this.validationError(res.alerts);
    }

    // MAGIA: Aquí "res.data" tiene autocompletado y tipos garantizados
    const cleanData = res.data;
    // cleanData.name (string)
    // cleanData.age (number | undefined)
}
```

## 3. Schemas Comunes y Transformaciones

Puedes (y debes) limpiar datos mientras validas.

```typescript
const SearchSchema = z.object({
    // Convertir Query Param "page=5" (string) -> 5 (number)
    page: z.string().transform(Number).pipe(z.number().min(1)),

    // Normalizar email
    email: z.string().email().toLowerCase().trim(),
})
```
