# Angular Integration Guide

Angular shines with its Dependency Injection system and RxJS.
Here we'll create a robust `BackendService`.

## 1. The Generic Service (`backend.service.ts`)

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
     * Executes a transaction against the backend.
     * @param tx Transaction ID
     * @param params Parameter object
     */
    execute<T>(tx: number, params: any = {}): Observable<T> {
        const payload = { tx, params }

        return this.http
            .post<TxResponse<T>>(this.apiUrl, payload, {
                withCredentials: true, // IMPORTANT: For session cookies
            })
            .pipe(
                map((response) => {
                    // In Angular, http.post already throws error if status is 4xx/5xx
                    // But if your backend returns 200 with logical error (not the case here),
                    // you could validate it here.
                    return response.data
                }),
                catchError(this.handleError)
            )
    }

    private handleError(error: HttpErrorResponse) {
        let errorMessage = 'Unknown error'

        if (error.error instanceof ErrorEvent) {
            // Client-side error (network)
            errorMessage = `Error: ${error.error.message}`
        } else {
            // Backend returned error code (400, 401, etc)
            // Our backend standardizes errors in "alerts" or "msg"
            const backendErr = error.error // TxResponse
            if (backendErr?.alerts?.length) {
                errorMessage = backendErr.alerts.join(', ')
            } else if (backendErr?.msg) {
                errorMessage = backendErr.msg
            }
        }
        // Returns an observable with clean message to show in UI
        return throwError(() => new Error(errorMessage))
    }
}
```

## 2. Usage Example: Component (RxJS)

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
                console.log('User logged in:', user)
                // Navigate to dashboard
            },
            error: (err) => {
                this.error = err.message // Translated message from backend
                this.loading = false
            },
            complete: () => (this.loading = false),
        })
    }
}
```
