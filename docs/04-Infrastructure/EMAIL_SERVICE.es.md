# Servicio de Email (`EmailService`)

El `EmailService` es un wrapper robusto alrededor de `nodemailer` diseñado para seguridad y "Developer Experience" (DX).

## Modos de Operación

Se configura en `.env` mediante `EMAIL_MODE`.

### 1. Modo `log` (Desarrollo)

En desarrollo, no quieres enviar emails reales (evitar spam o costos).
El servicio **simula** el envío e imprime el contenido en la consola.

**Seguridad**: Por defecto, enmascara los tokens para evitar que se filtren en logs persistentes, a menos que `EMAIL_LOG_SECRETS=true`.

```typescript
// .env
EMAIL_MODE = log
```

**Salida en Consola**:

```text
[INFO] [Email:log] Would send email to=el***@example.com subject="Verify your login"
```

### 2. Modo `smtp` (Producción)

Usa un servidor SMTP real (AWS SES, SendGrid, Gmail, etc).

```typescript
// .env
EMAIL_MODE=smtp
EMAIL_SMTP_HOST=smtp.sendgrid.net
EMAIL_SMTP_PORT=587
EMAIL_SMTP_USER=apikey
EMAIL_SMTP_PASS=...
EMAIL_SMTP_SECURE=true
```

## Uso en Código

El servicio estandariza los tipos de correos "transaccionales" vitales.

```typescript
// Inyectarlo (normalmente ya viene en BaseBO como this.email si lo extendieras,
// pero en realidad se instancia dentro de los BOs o servicios que lo necesitan)

const email = new EmailService({ log, config })

// Enviar código de verificación
await email.sendEmailVerification({
    to: 'usuario@email.com',
    code: '123456',
    token: 'abcdef...',
})
```

## Métodos Predefinidos

Para mantener consistencia, no usamos `sendMail` directamente desde los BOs. Usamos métodos semánticos:

- `sendLoginChallenge`: Código para 2FA o Login sin password.
- `sendEmailVerification`: Verificación de cuenta nueva.
- `sendPasswordReset`: Recuperación de contraseña.

Si necesitas enviar un correo genérico, puedes extender la clase o añadir un método nuevo en `EmailService.ts`.
