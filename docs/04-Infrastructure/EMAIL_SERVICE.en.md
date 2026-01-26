# Email Service (`EmailService`)

The `EmailService` is a robust wrapper around `nodemailer` designed for security and Developer Experience (DX).

## Operation Modes

Configured in `.env` via `EMAIL_MODE`.

### 1. `log` Mode (Development)

In dev, you don't want to send real emails (avoid spam or costs).
The service **simulates** sending and prints content to console.

**Security**: By default, it masks tokens to prevent leakage in persistent logs, unless `EMAIL_LOG_SECRETS=true`.

```typescript
// .env
EMAIL_MODE = log
```

**Console Output**:

```text
[INFO] [Email:log] Would send email to=el***@example.com subject="Verify your login"
```

### 2. `smtp` Mode (Production)

Uses a real SMTP server (AWS SES, SendGrid, Gmail, etc).

```typescript
// .env
EMAIL_MODE=smtp
EMAIL_SMTP_HOST=smtp.sendgrid.net
EMAIL_SMTP_PORT=587
EMAIL_SMTP_USER=apikey
EMAIL_SMTP_PASS=...
EMAIL_SMTP_SECURE=true
```

## Usage in Code

The service standardizes vital "transactional" email types.

```typescript
// Inject it (usually instantiated inside BOs or Services)

const email = new EmailService({ log, config })

// Send verification code
await email.sendEmailVerification({
    to: 'user@email.com',
    code: '123456',
    token: 'abcdef...',
})
```

## Predefined Methods

To maintain consistency, we don't use `sendMail` directly from BOs. We use semantic methods:

- `sendLoginChallenge`: Code for 2FA or Passwordless Login.
- `sendEmailVerification`: New account verification.
- `sendPasswordReset`: Password recovery.

If you need to send a generic email, you can extend the class or add a new method in `EmailService.ts`.
