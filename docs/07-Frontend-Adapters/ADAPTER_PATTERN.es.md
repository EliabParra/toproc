# Patrón de Adaptador Frontend (General)

ToProccess usa una arquitectura **Transaction-Oriented**. Esto significa que no consumirás endpoints REST tradicionales (`GET /users`), sino que enviarás **Intenciones de Negocio** a un único endpoint.

Este documento explica cómo construir un "Cliente Http" genérico para cualquier framework (Vanilla, Svelte, Mobile, etc).

---

## 1. La Anatomía de la Petición

Toda interacción con el backend sigue este contrato estricto:

**Endpoint**: `POST /toProccess`
**Content-Type**: `application/json`

### Payload (Lo que envías)

```typescript
interface TxRequest {
    tx: number // ID de la Transacción (Ej: 1001)
    params?: Record<string, any> // Datos adicionales
}
```

### Response (Lo que recibes)

```typescript
interface TxResponse<T = any> {
    code: number // 200, 400, 401, 500, etc.
    msg: string // Mensaje corto ("OK", "Validation Error")
    data?: T // Datos de éxito (Si code == 2xx)
    alerts?: string[] // Listen de errores (Si code >= 400)
}
```

---

## 2. Implementación con Fetch (Vanilla JS)

La forma más estandard de conectar, sin librerías externas.

```typescript
// api.ts
const API_URL = 'http://localhost:3000/toProccess'

export async function request<T>(tx: number, params: object = {}): Promise<T> {
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            // 'csrf-token': '...' // Ver sección de seguridad
        },
        // Importante: Las cookies (sesión) deben enviarse automáticamente
        credentials: 'include',
        body: JSON.stringify({ tx, params }),
    })

    // El backend siempre devuelve JSON, incluso en error 500 (si es controlado)
    const result = await response.json()

    if (response.ok && result.code < 400) {
        return result.data as T
    } else {
        // Manejo unificado de errores
        const errorMsg = result.alerts ? result.alerts.join(', ') : result.msg
        throw new Error(errorMsg)
    }
}
```

---

## 3. Implementación con Axios (Recomendado)

Axios maneja mejor los timeouts y la serialización JSON.

```typescript
import axios from 'axios'

const api = axios.create({
    baseURL: 'http://localhost:3000',
    withCredentials: true, // ¡CRÍTICO! Para que viajen las cookies de sesión
})

export async function execute<T>(tx: number, params: object = {}): Promise<T> {
    try {
        const res = await api.post('/toProccess', { tx, params })

        // Nuestro backend devuelve statusCode HTTP real (200, 400),
        // pero también lo incluye en el body "code".
        return res.data.data
    } catch (err: any) {
        // Axios lanza error si status no es 2xx
        if (err.response && err.response.data) {
            const backendError = err.response.data
            const message = backendError.alerts ? backendError.alerts.join('\n') : backendError.msg

            throw new Error(message)
        }
        throw err // Error de red u otro
    }
}
```
