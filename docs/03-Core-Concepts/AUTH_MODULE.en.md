# Authentication Module (Auth Module)

The `Auth` module is the identity guardian.
It implements secure flows for Registration, Email Verification, and Password Recovery following OWASP best practices.

## Internal Architecture

Follows the 4-layer architecture and ships **8 files** today (a 9th module file will be added in future updates):

1.  **AuthBO (`AuthBO.ts`)**: Controller. Validates inputs with Zod.
2.  **AuthService (`AuthService.ts`)**: Business logic (Hashing, OTPs).
3.  **AuthRepository (`AuthRepository.ts`)**: SQL Queries.
4.  **AuthSchemas (`AuthSchemas.ts`)**: Validation definitions.

**Current files (8):**

- `AuthBO.ts`
- `AuthService.ts`
- `AuthRepository.ts`
- `AuthSchemas.ts`
- `AuthTypes.ts`
- `AuthMessages.ts`
- `AuthErrors.ts`
- `AuthQueries.ts`

**Planned file (9th):**

- `AuthModule.ts` (module barrel exports)

> Note: Login/session handling lives in the Session layer (see Session docs). Auth only provides identity flows.

---

## Main Flows

### 1. Registration (`register`)

- **Input**: `name`, `email`, `password`.
- **Process**:
    1.  Checks if email or username already exists (Fail Fast).
    2.  Hashes password with `bcryptjs` (auto salt, cost 10).
    3.  Creates user in `security.users`.
    4.  Creates profile in `security.user_profiles` (configurable initial role).
    5.  If `AUTH_REQUIRE_EMAIL_VERIFICATION=true`, sends a verification email with a token.
- **Output**: 201 Created.

### 2. Verify Email (`verifyEmail`)

- **Mechanism**: URL token only.
- **Security**: The token is stored hashed and expires (current default: 900 seconds).
- **Result**: Sets `email_verified_at` in DB and consumes the token.

### 3. Request Email Verification (`requestEmailVerification`)

- **Input**: `identifier` (email or username).
- **Process**:
    1.  Looks up the user by identifier.
    2.  If found, sends a fresh verification email.

### 4. Password Recovery (`requestPasswordReset`)

- **Secure Design**:
    - If email does not exist, **responds OK anyway** (Silent Success).
    - This prevents user enumeration.
    - Invalidates any previous active reset tokens.
- **Process**:
    1.  Generates a cryptographic token (32 hex bytes).
    2.  Stores only the token hash in DB (never the plain token).
    3.  Sends an email with the reset token.

### 5. Verify Reset Token (`verifyPasswordReset`)

- **Input**: `token`.
- **Result**: Confirms the token exists and is unused (no state change).

### 6. Reset Password (`resetPassword`)

- **Input**: `token`, `newPassword`.
- **Process**:
    1.  Validates token.
    2.  Hashes new password.
    3.  Updates `security.users`.
    4.  Marks the reset record as "used".

---

## Configuration (.env)

| Variable                          | Description                       | Default                |
| :-------------------------------- | :-------------------------------- | :--------------------- |
| `AUTH_REQUIRE_EMAIL_VERIFICATION` | Block login until email verified. | `false`                |
| `AUTH_SESSION_PROFILE_ID`         | Profile ID assigned on register.  | `1` (should be 2/User) |

## Involved Tables

- `security.users`: Credentials and status.
- `security.user_profiles`: Assigned roles.
- `security.one_time_codes`: Temporary OTP storage.
- `security.password_resets`: Reset request history.
