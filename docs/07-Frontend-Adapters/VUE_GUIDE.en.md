# Vue 3 Integration Guide

Vue 3 with Composition API is perfect for encapsulating connection logic in a **Composable**.

## 1. The `useApi` Composable

```typescript
// composables/useApi.ts
import { ref } from 'vue'
import axios from 'axios'

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
    withCredentials: true,
})

export function useApi() {
    const loading = ref(false)
    const error = ref<string | null>(null)

    /**
     * Executes a transaction.
     * Returns data or throws/returns null based on preference.
     */
    async function execute<T>(tx: number, params: any = {}): Promise<T | null> {
        loading.value = true
        error.value = null

        try {
            const res = await api.post('/toProccess', { tx, params })
            return res.data.data
        } catch (err: any) {
            if (err.response?.data) {
                // Backend format: { alerts: [], msg: "..." }
                const backendErr = err.response.data
                error.value = backendErr.alerts ? backendErr.alerts.join(', ') : backendErr.msg
            } else {
                error.value = err.message || 'Connection Error'
            }
            return null
        } finally {
            loading.value = false
        }
    }

    return { execute, loading, error }
}
```

## 2. Usage Example: Script Setup

The `<script setup>` syntax makes code extremely concise.

```vue
<!-- LoginView.vue -->
<script setup lang="ts">
import { reactive } from 'vue'
import { useApi } from '@/composables/useApi'
import { useRouter } from 'vue-router'

const TX_LOGIN = 1001

const router = useRouter()
const { execute, loading, error } = useApi()

const form = reactive({
    email: '',
    password: '',
})

async function handleLogin() {
    const user = await execute(TX_LOGIN, form)

    if (user) {
        // Success: user contains data returned by Auth.login
        alert(`Hello ${user.name}`)
        router.push('/dashboard')
    }
    // If fails, "error" will exist and show in template
}
</script>

<template>
    <div class="login-box">
        <h1>Login</h1>

        <div v-if="error" class="error-msg">
            {{ error }}
        </div>

        <form @submit.prevent="handleLogin">
            <input v-model="form.email" type="email" placeholder="Email" required />
            <input v-model="form.password" type="password" placeholder="Password" required />

            <button :disabled="loading">
                {{ loading ? 'Loading...' : 'Enter' }}
            </button>
        </form>
    </div>
</template>
```
