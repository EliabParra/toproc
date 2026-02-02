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

El servicio ahora es **genérico** y soporta plantillas HTML.

```typescript
// Inyectarlo (normalmente ya viene en BaseBO como this.email si lo extendieras)
const email = new EmailService({ log, config })

// Enviar usando plantilla HTML
await email.sendTemplate({
    to: 'usuario@email.com',
    subject: 'Bienvenido a la App',
    templatePath: 'auth/welcome.html', // relativo a src/templates/emails/
    data: {
        name: 'Juan Perez',
        code: '123456',
    },
})

// Enviar mensaje simple (texto/html raw)
await email.send({
    to: 'admin@email.com',
    subject: 'Alerta del Sistema',
    text: 'Algo sucedió...',
})
```

## Sistema de Plantillas

Las plantillas se encuentran en `src/templates/emails/`.
El sistema soporta interpolación simple de variables usando `{{variable}}`.

Ejemplo `src/templates/emails/auth/code.html`:

```html
<p>Hola {{name}}, tu código es <b>{{code}}</b>.</p>
```

## Métodos Disponibles

- `send(options)`: Envío básico.
- `sendTemplate(options)`: Carga plantilla, interpola datos y envía.
- `maskEmail(email)`: Utilidad para logs seguros.

> Nota: Los métodos específicos como `sendLoginChallenge` han sido deprecados a favor de `sendTemplate` para mayor flexibilidad.
