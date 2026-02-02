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

The service is now **generic** and supports HTML templates.

```typescript
// Inject it (usually instantiated inside BOs or Services)
const email = new EmailService({ log, config })

// Send using HTML template
await email.sendTemplate({
    to: 'user@email.com',
    subject: 'Welcome to App',
    templatePath: 'auth/welcome.html', // relative to src/templates/emails/
    data: {
        name: 'John Doe',
        code: '123456',
    },
})

// Send simple message (raw text/html)
await email.send({
    to: 'admin@email.com',
    subject: 'System Alert',
    text: 'Something happened...',
})
```

## Template System

Templates are located in `src/templates/emails/`.
The system supports simple variable interpolation using `{{variable}}`.

Example `src/templates/emails/auth/code.html`:

```html
<p>Hello {{name}}, your code is <b>{{code}}</b>.</p>
```

## Available Methods

- `send(options)`: Basic sending.
- `sendTemplate(options)`: Loads template, interpolates data, and sends.
- `maskEmail(email)`: Utility for safe logs.

> Note: Specific methods like `sendLoginChallenge` have been deprecated in favor of `sendTemplate` for greater flexibility.
