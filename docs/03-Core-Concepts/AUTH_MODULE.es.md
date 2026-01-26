# Módulo de Autenticación (Auth Module)

El módulo `Auth` es el guardián de la identidad.
Implementa flujos seguros de Registro, Verificación de Email, y Recuperación de Contraseña siguiendo las mejores prácticas de OWASP.

## Arquitectura Interna

Sigue la arquitectura de 4 capas:

1.  **AuthBO (`AuthBO.ts`)**: Controlador. Valida entradas con Zod.
2.  **AuthService (`AuthService.ts`)**: Lógica de negocio (Hashing, OTPs).
3.  **AuthRepository (`AuthRepository.ts`)**: SQL Queries.
4.  **AuthSchemas (`schemas.ts`)**: Definiciones de validación.

---

## Flujos Principales

### 1. Registro (`register`)

- **Input**: `username`, `email`, `password`.
- **Proceso**:
    1.  Verifica si email o username ya existen (Fail Fast).
    2.  Hashea password con `bcrypt` (Salt automático, costo 10).
    3.  Crea usuario en tabla `users`.
    4.  Crea perfil en tabla `profiles` (Rol inicial configurable).
    5.  Si `REQUIRE_EMAIL_VERIFICATION=true`, genera OTP y token.
- **Output**: 201 Created.

### 2. Verificar Email (`verifyEmail`)

- **Mecanismo**: Doble factor (Token URL + Código OTP de 6 dígitos).
- **Seguridad**:
    - Protección contra fuerza bruta (`emailVerificationMaxAttempts`).
    - Expiración de token (`emailVerificationExpiresSeconds`).
- **Resultado**: Marca `email_verified = true` en DB.

### 3. Recuperar Contraseña (`requestPasswordReset`)

- **Diseño Seguro**:
    - Si el email no existe, **responde OK igualmente** (Silent Success).
    - Esto previene "Enumeración de Usuarios" (que un atacante sepa quién está registrado).
    - Invalida cualquier token de reset anterior activo.
- **Proceso**:
    1.  Genera Token criptográfico (32 bytes hex) y Código OTP (6 dígitos).
    2.  Guarda hash del token en DB (nunca el token plano).
    3.  Envía email con Token y Código.

### 4. Resetear Contraseña (`resetPassword`)

- **Input**: `token`, `code`, `newPassword`.
- **Proceso**:
    1.  Valida Token y OTP.
    2.  Hashea nueva password.
    3.  Actualiza `users`.
    4.  **Invalida todas las sesiones activas** del usuario (Logout forzado de otros dispositivos).
    5.  Consume el OTP y marca el reset como "usado".

---

## Configuración (.env)

| Variable                          | Descripción                           | Default                       |
| :-------------------------------- | :------------------------------------ | :---------------------------- |
| `AUTH_LOGIN_ID`                   | Usar `email` o `username` para login. | `email`                       |
| `AUTH_REQUIRE_EMAIL_VERIFICATION` | Bloquear login hasta verificar email. | `false`                       |
| `AUTH_SESSION_PROFILE_ID`         | Perfil ID asignado al registrarse.    | `1` (pero debería ser 2/User) |

## Tablas Involucradas

- `security.users_base`: Credenciales y estado.
- `security.user_profiles`: Roles asignados.
- `security.one_time_codes`: Almacén temporal de OTPs.
- `security.password_resets`: Historial de solicitudes de reset.
