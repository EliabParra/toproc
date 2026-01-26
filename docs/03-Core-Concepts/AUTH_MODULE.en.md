# Authentication Module (Auth Module)

The `Auth` module is the identity guardian.
It implements secure flows for Registration, Email Verification, and Password Recovery following OWASP best practices.

## Internal Architecture

Follows the 4-layer architecture:

1.  **AuthBO (`AuthBO.ts`)**: Controller. Validates inputs with Zod.
2.  **AuthService (`AuthService.ts`)**: Business logic (Hashing, OTPs).
3.  **AuthRepository (`AuthRepository.ts`)**: SQL Queries.
4.  **AuthSchemas (`schemas.ts`)**: Validation definitions.

---

## Main Flows

### 1. Registration (`register`)

- **Input**: `username`, `email`, `password`.
- **Process**:
    1.  Checks if email or username already exists (Fail Fast).
    2.  Hashes password with `bcrypt` (Auto salt, cost 10).
    3.  Creates user in `users` table.
    4.  Creates profile in `profiles` table (Configurable initial role).
    5.  If `REQUIRE_EMAIL_VERIFICATION=true`, generates OTP and token.
- **Output**: 201 Created.

### 2. Verify Email (`verifyEmail`)

- **Mechanism**: Double factor (URL Token + 6-digit OTP Code).
- **Security**:
    - Brute force protection (`emailVerificationMaxAttempts`).
    - Token expiration (`emailVerificationExpiresSeconds`).
- **Result**: Sets `email_verified = true` in DB.

### 3. Password Recovery (`requestPasswordReset`)

- **Secure Design**:
    - If email allows not exist, **responds OK anyway** (Silent Success).
    - This prevents "User Enumeration" (attacker knowing who is registered).
    - Invalidates any previous active reset tokens.
- **Process**:
    1.  Generates Cryptographic Token (32 hex bytes) and OTP Code (6 digits).
    2.  Saves token hash in DB (never plain token).
    3.  Sends email with Token and Code.

### 4. Reset Password (`resetPassword`)

- **Input**: `token`, `code`, `newPassword`.
- **Process**:
    1.  Validates Token and OTP.
    2.  Hashes new password.
    3.  Updates `users`.
    4.  **Invalidates all active sessions** for the user (Forced logout from other devices).
    5.  Consumes OTP and marks reset as "used".

---

## Configuration (.env)

| Variable                          | Description                          | Default                |
| :-------------------------------- | :----------------------------------- | :--------------------- |
| `AUTH_LOGIN_ID`                   | Use `email` or `username` for login. | `email`                |
| `AUTH_REQUIRE_EMAIL_VERIFICATION` | Block login until email verified.    | `false`                |
| `AUTH_SESSION_PROFILE_ID`         | Profile ID assigned on register.     | `1` (should be 2/User) |

## Involved Tables

- `security.users_base`: Credentials and status.
- `security.user_profiles`: Assigned roles.
- `security.one_time_codes`: Temporary OTP storage.
- `security.password_resets`: Reset request history.
