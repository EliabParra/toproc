# Guía de Integración React

Esta guía asume que usas React 18+ con Hooks.

## 1. El Hook `useTx`

En lugar de repetir llamadas a Axios en cada componente, creamos un hook personalizado que maneja el estado de carga (`loading`) y errores (`error`).

```typescript
// hooks/useTx.ts
import { useState } from 'react'
import { execute } from '../api/axios-client' // Tu cliente Axios configurado

interface UseTxState<T> {
    data: T | null
    loading: boolean
    error: string | null
    executeTx: (params?: object) => Promise<T | undefined>
}

export function useTx<T = any>(txId: number): UseTxState<T> {
    const [data, setData] = useState<T | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const executeTx = async (params: object = {}) => {
        setLoading(true)
        setError(null)
        try {
            const result = await execute<T>(txId, params)
            setData(result)
            return result
        } catch (err: any) {
            setError(err.message)
            return undefined
        } finally {
            setLoading(false)
        }
    }

    return { data, loading, error, executeTx }
}
```

## 2. Ejemplo de Uso: Login Component

Observa qué limpio queda el componente. No sabe nada de URLs ni Headers. Solo conoce la Transacción `1001` (Login).

```tsx
// components/LoginForm.tsx
import React, { useState } from 'react'
import { useTx } from '../hooks/useTx'

// ID de Transacción para Auth.login (ver security definition)
const TX_LOGIN = 1001

export const LoginForm = () => {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')

    const { executeTx, loading, error } = useTx(TX_LOGIN)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const user = await executeTx({ email, password })

        if (user) {
            alert(`Bienvenido, ${user.name}`)
            // Redirigir al dashboard...
        }
    }

    return (
        <form onSubmit={handleSubmit}>
            {error && <div className="error-banner">{error}</div>}

            <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
            />

            <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
            />

            <button type="submit" disabled={loading}>
                {loading ? 'Entrando...' : 'Iniciar Sesión'}
            </button>
        </form>
    )
}
```

## 3. Global Context (Auth)

Para la sesión del usuario, recomendamos un Contexto Global que cargue el perfil al inicio.

```tsx
// context/AuthContext.tsx
import { createContext, useEffect, useContext } from 'react'
import { useTx } from '../hooks/useTx'

const TX_GET_PROFILE = 1005 // Supongamos que esta TX devuelve "mi perfil"

export const AuthProvider = ({ children }) => {
    const { data: user, executeTx, loading } = useTx(TX_GET_PROFILE)

    useEffect(() => {
        executeTx() // Cargar perfil al montar App
    }, [])

    if (loading) return <div>Cargando app...</div>

    return (
        <AuthContext.Provider value={{ user, refreshUser: executeTx }}>
            {children}
        </AuthContext.Provider>
    )
}
```
