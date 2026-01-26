# Guía de Integración Angular

Angular brilla con su sistema de Inyección de Dependencias y RxJS.
Aquí crearemos un `BackendService` robusto.

## 1. El Servicio Genérico (`backend.service.ts`)

```typescript
import { Injectable } from '@angular/core'
import { HttpClient, HttpErrorResponse } from '@angular/common/http'
import { Observable, throwError } from 'rxjs'
import { catchError, map } from 'rxjs/operators'
import { environment } from '../../environments/environment'

export interface TxResponse<T> {
    code: number
    msg: string
    data: T
    alerts?: string[]
}

@Injectable({
    providedIn: 'root',
})
export class BackendService {
    private apiUrl = `${environment.apiUrl}/toProccess`

    constructor(private http: HttpClient) {}

    /**
     * Ejecuta una transacción contra el backend.
     * @param tx ID de la Transacción
     * @param params Objetos de parámetros
     */
    execute<T>(tx: number, params: any = {}): Observable<T> {
        const payload = { tx, params }

        return this.http
            .post<TxResponse<T>>(this.apiUrl, payload, {
                withCredentials: true, // IMPORTANTE: Para cookies de sesión
            })
            .pipe(
                map((response) => {
                    // En Angular, http.post ya lanza error si el status es 4xx/5xx
                    // Pero si tu backend devuelve 200 con error lógico (no es el caso aquí),
                    // podrías validarlo acá.
                    return response.data
                }),
                catchError(this.handleError)
            )
    }

    private handleError(error: HttpErrorResponse) {
        let errorMessage = 'Error desconocido'

        if (error.error instanceof ErrorEvent) {
            // Error del lado del cliente (red)
            errorMessage = `Error: ${error.error.message}`
        } else {
            // El backend retornó un código de error (400, 401, etc)
            // Nuestro backend estandariza los errores en "alerts" o "msg"
            const backendErr = error.error // TxResponse
            if (backendErr?.alerts?.length) {
                errorMessage = backendErr.alerts.join(', ')
            } else if (backendErr?.msg) {
                errorMessage = backendErr.msg
            }
        }
        // Retorna un observable con el mensaje limpio para mostrar en UI
        return throwError(() => new Error(errorMessage))
    }
}
```

## 2. Ejemplo de Uso: Componente (RxJS)

```typescript
// login.component.ts
import { Component } from '@angular/core'
import { FormBuilder, FormGroup, Validators } from '@angular/forms'
import { BackendService } from '../services/backend.service'

const TX_LOGIN = 1001

@Component({
    selector: 'app-login',
    template: `
        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
            <input formControlName="email" placeholder="Email" />
            <input formControlName="password" type="password" />

            <div *ngIf="error" class="alert alert-danger">{{ error }}</div>

            <button type="submit" [disabled]="loading">Login</button>
        </form>
    `,
})
export class LoginComponent {
    loginForm: FormGroup
    loading = false
    error = ''

    constructor(
        private fb: FormBuilder,
        private backend: BackendService
    ) {
        this.loginForm = this.fb.group({
            email: ['', [Validators.required, Validators.email]],
            password: ['', Validators.required],
        })
    }

    onSubmit() {
        if (this.loginForm.invalid) return

        this.loading = true
        this.error = ''

        const params = this.loginForm.value

        this.backend.execute<any>(TX_LOGIN, params).subscribe({
            next: (user) => {
                console.log('Usuario logueado:', user)
                // Navigate to dashboard
            },
            error: (err) => {
                this.error = err.message // Mensaje traducido del backend
                this.loading = false
            },
            complete: () => (this.loading = false),
        })
    }
}
```
