# React Integration Guide

This guide assumes you are using React 18+ with Hooks.

## 1. The `useTx` Hook

Instead of repeating Axios calls in every component, we create a custom hook handling `loading` state and `error` state.

```typescript
// hooks/useTx.ts
import { useState } from 'react'
import { execute } from '../api/axios-client' // Your configured Axios client

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

## 2. Usage Example: Login Component

Notice how clean the component remains. It knows nothing about URLs or Headers. It only knows Transaction `1001` (Login).

```tsx
// components/LoginForm.tsx
import React, { useState } from 'react'
import { useTx } from '../hooks/useTx'

// Transaction ID for Auth.login (see security definition)
const TX_LOGIN = 1001

export const LoginForm = () => {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')

    const { executeTx, loading, error } = useTx(TX_LOGIN)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const user = await executeTx({ email, password })

        if (user) {
            alert(`Welcome, ${user.name}`)
            // Redirect to dashboard...
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
                {loading ? 'Logging in...' : 'Login'}
            </button>
        </form>
    )
}
```

## 3. Global Context (Auth)

For user session, we recommend a Global Context loading the profile on startup.

```tsx
// context/AuthContext.tsx
import { createContext, useEffect, useContext } from 'react'
import { useTx } from '../hooks/useTx'

const TX_GET_PROFILE = 1005 // Suppose this TX returns "my profile"

export const AuthProvider = ({ children }) => {
    const { data: user, executeTx, loading } = useTx(TX_GET_PROFILE)

    useEffect(() => {
        executeTx() // Load profile when App mounts
    }, [])

    if (loading) return <div>Loading app...</div>

    return (
        <AuthContext.Provider value={{ user, refreshUser: executeTx }}>
            {children}
        </AuthContext.Provider>
    )
}
```
