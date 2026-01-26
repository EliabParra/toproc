# Frontend Adapter Pattern (General)

ToProccess uses a **Transaction-Oriented** architecture. This means you won't consume traditional REST endpoints (`GET /users`), but instead send **Business Intents** to a single endpoint.

This document explains how to build a generic "Http Client" for any framework (Vanilla, Svelte, Mobile, etc).

---

## 1. Request Anatomy

Every interaction with the backend follows this strict contract:

**Endpoint**: `POST /toProccess`
**Content-Type**: `application/json`

### Payload (What you send)

```typescript
interface TxRequest {
    tx: number // Transaction ID (Ex: 1001)
    params?: Record<string, any> // Additional data
}
```

### Response (What you get)

```typescript
interface TxResponse<T = any> {
    code: number // 200, 400, 401, 500, etc.
    msg: string // Short message ("OK", "Validation Error")
    data?: T // Success data (If code == 2xx)
    alerts?: string[] // Error list (If code >= 400)
}
```

---

## 2. Implementation with Fetch (Vanilla JS)

The standard way to connect, without external libraries.

```typescript
// api.ts
const API_URL = 'http://localhost:3000/toProccess'

export async function request<T>(tx: number, params: object = {}): Promise<T> {
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            // 'csrf-token': '...' // See security section
        },
        // Important: Cookies (session) must be sent automatically
        credentials: 'include',
        body: JSON.stringify({ tx, params }),
    })

    // Backend always returns JSON, even on error 500 (if controlled)
    const result = await response.json()

    if (response.ok && result.code < 400) {
        return result.data as T
    } else {
        // Unified error handling
        const errorMsg = result.alerts ? result.alerts.join(', ') : result.msg
        throw new Error(errorMsg)
    }
}
```

---

## 3. Implementation with Axios (Recommended)

Axios handles timeouts and JSON serialization better.

```typescript
import axios from 'axios'

const api = axios.create({
    baseURL: 'http://localhost:3000',
    withCredentials: true, // CRITICAL! For session cookies to travel
})

export async function execute<T>(tx: number, params: object = {}): Promise<T> {
    try {
        const res = await api.post('/toProccess', { tx, params })

        // Our backend returns real HTTP statusCode (200, 400),
        // but also includes it in the "code" body field.
        return res.data.data
    } catch (err: any) {
        // Axios throws error if status is not 2xx
        if (err.response && err.response.data) {
            const backendError = err.response.data
            const message = backendError.alerts ? backendError.alerts.join('\n') : backendError.msg

            throw new Error(message)
        }
        throw err // Network error or other
    }
}
```
