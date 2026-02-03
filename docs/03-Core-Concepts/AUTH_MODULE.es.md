# Módulo de Autenticación (Auth Module)

El módulo `Auth` es el guardián de la identidad.
Implementa flujos seguros de Registro, Verificación de Email, y Recuperación de Contraseña siguiendo las mejores prácticas de OWASP.

## Arquitectura Interna

Sigue la arquitectura de 4 capas y hoy incluye **8 archivos** (el 9no archivo de módulo llegará en próximas actualizaciones):

1.  **AuthBO (`AuthBO.ts`)**: Controlador. Valida entradas con Zod.
2.  **AuthService (`AuthService.ts`)**: Lógica de negocio (Hashing, OTPs).
3.  **AuthRepository (`AuthRepository.ts`)**: SQL Queries.
4.  **AuthSchemas (`AuthSchemas.ts`)**: Definiciones de validación.

**Archivos actuales (8):**

- `AuthBO.ts`
- `AuthService.ts`
- `AuthRepository.ts`
- `AuthSchemas.ts`
- `AuthTypes.ts`
- `AuthMessages.ts`
- `AuthErrors.ts`
- `AuthQueries.ts`

**Archivo planificado (9no):**

- `AuthModule.ts` (barril de exportaciones)

> Nota: El login/sesión vive en la capa de Session. Auth solo cubre flujos de identidad.

---

## Flujos Principales

### 1. Registro (`register`)

- **Input**: `name`, `email`, `password`.
- **Proceso**:
    1.  Verifica si email o username ya existen (Fail Fast).
    2.  Hashea password con `bcryptjs` (Salt automático, costo 10).
    3.  Crea usuario en `security.users`.
    4.  Crea perfil en `security.user_profiles` (Rol inicial configurable).
    5.  Si `AUTH_REQUIRE_EMAIL_VERIFICATION=true`, envía email de verificación con token.
- **Output**: 201 Created.

### 2. Verificar Email (`verifyEmail`)

- **Mecanismo**: Solo token URL.
- **Seguridad**: El token se guarda hasheado y expira (por defecto actual: 900 segundos).
- **Resultado**: Marca `email_verified_at` y consume el token.

### 3. Solicitar Verificación de Email (`requestEmailVerification`)

- **Input**: `identifier` (email o username).
- **Proceso**:
    1.  Busca el usuario por identificador.
    2.  Si existe, envía un nuevo email de verificación.

### 4. Recuperar Contraseña (`requestPasswordReset`)

- **Diseño Seguro**:
    - Si el email no existe, **responde OK igualmente** (Silent Success).
    - Previene enumeración de usuarios.
    - Invalida cualquier token de reset anterior activo.
- **Proceso**:
    1.  Genera un token criptográfico (32 bytes hex).
    2.  Guarda el hash del token en DB (nunca el token plano).
    3.  Envía email con el token de reset.

### 5. Verificar Token de Reset (`verifyPasswordReset`)

- **Input**: `token`.
- **Resultado**: Confirma que el token existe y no está usado (sin cambios de estado).

### 6. Resetear Contraseña (`resetPassword`)

- **Input**: `token`, `newPassword`.
- **Proceso**:
    1.  Valida el token.
    2.  Hashea nueva password.
    3.  Actualiza `security.users`.
    4.  Marca el reset como "usado".

---

## Configuración (.env)

| Variable                          | Descripción                           | Default                       |
| :-------------------------------- | :------------------------------------ | :---------------------------- |
| `AUTH_REQUIRE_EMAIL_VERIFICATION` | Bloquear login hasta verificar email. | `false`                       |
| `AUTH_SESSION_PROFILE_ID`         | Perfil ID asignado al registrarse.    | `1` (pero debería ser 2/User) |

## Tablas Involucradas

- `security.users`: Credenciales y estado.
- `security.user_profiles`: Roles asignados.
- `security.one_time_codes`: Almacén temporal de OTPs.
- `security.password_resets`: Historial de solicitudes de reset.
