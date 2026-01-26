# Guía de Integración Vue 3

Vue 3 con Composition API es perfecto para encapsular la lógica de conexión en un **Composable**.

## 1. El Composable `useApi`

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
     * Ejecuta una transacción.
     * Retorna los datos o lanza excepción si prefieres manejarlo con try/catch fuera.
     */
    async function execute<T>(tx: number, params: any = {}): Promise<T | null> {
        loading.value = true
        error.value = null

        try {
            const res = await api.post('/toProccess', { tx, params })
            return res.data.data
        } catch (err: any) {
            if (err.response?.data) {
                // Formato backend: { alerts: [], msg: "..." }
                const backendErr = err.response.data
                error.value = backendErr.alerts ? backendErr.alerts.join(', ') : backendErr.msg
            } else {
                error.value = err.message || 'Error de conexión'
            }
            return null
        } finally {
            loading.value = false
        }
    }

    return { execute, loading, error }
}
```

## 2. Ejemplo de Uso: Script Setup

La sintaxis `<script setup>` hace que el código sea extremadamente conciso.

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
        // Éxito: user contiene los datos devueltos por Auth.login
        alert(`Hola ${user.name}`)
        router.push('/dashboard')
    }
    // Si falla, "error" tendrá el mensaje y se mostrará en el template
}
</script>

<template>
    <div class="login-box">
        <h1>Acceso</h1>

        <div v-if="error" class="error-msg">
            {{ error }}
        </div>

        <form @submit.prevent="handleLogin">
            <input v-model="form.email" type="email" placeholder="Correo" required />
            <input v-model="form.password" type="password" placeholder="Contraseña" required />

            <button :disabled="loading">
                {{ loading ? 'Cargando...' : 'Entrar' }}
            </button>
        </form>
    </div>
</template>
```
