# Guía de Entorno y Configuración

ToProccess sigue la metodología **Twelve-Factor App**, almacenando toda la configuración en variables de entorno.

## 1. Obligatorio vs Opcional

Aunque casi todas las variables tienen un valor por defecto (para facilitar el desarrollo local), en **PRODUCCIÓN** ciertas variables son mandatorias por seguridad.

El servidor incorpora validación **Zod** al inicio. Si detecta una configuración combinada inválida (ej. `EMAIL_MODE=smtp` sin `EMAIL_SMTP_HOST`), se negará a iniciar.

---

## 2. Web Server (Exclusivo Servidor)

Estas variables definen cómo el servidor escucha peticiones.

| Variable          | Local Default | Producción           | ¿Obligatorio?                      |
| :---------------- | :------------ | :------------------- | :--------------------------------- |
| `NODE_ENV`        | `development` | `production`         | **SÍ** (Cambia logs, seguridad)    |
| `APP_PORT`        | `3000`        | (Asignado por Cloud) | **SÍ**                             |
| `APP_HOST`        | `localhost`   | `0.0.0.0`            | **SÍ** (En Docker/Render)          |
| `APP_TRUST_PROXY` | `0`           | `1`                  | **SÍ** (Si usas Load Balancer/SSL) |

## 3. Base de Datos (Credenciales)

**⚠️ CRÍTICO**: Nunca comitear estas, solo ponerlas en el dashboard del hosting.

| Variable     | Local Default | Producción         | ¿Obligatorio?         |
| :----------- | :------------ | :----------------- | :-------------------- |
| `PGHOST`     | `localhost`   | `db.render.com`... | **SÍ**                |
| `PGUSER`     | `postgres`    | `app_user`         | **SÍ**                |
| `PGPASSWORD` | `""`          | `XyZ123...`        | **SÍ**                |
| `PGDATABASE` | `postgres`    | `mi_app_db`        | **SÍ**                |
| `PGSSL`      | `false`       | `true`             | Depende del proveedor |

## 4. Seguridad y Sesiones (Exclusivo Servidor)

| Variable                | Local Default | Producción          | ¿Obligatorio?                 |
| :---------------------- | :------------ | :------------------ | :---------------------------- |
| `SESSION_SECRETS`       | `secret`      | `a8f93...`          | **SÍ** (Mínimo 32 caracteres) |
| `SESSION_COOKIE_SECURE` | `false`       | `true`              | Recomendado                   |
| `CORS_ORIGINS`          | -             | `https://miweb.com` | **SÍ** (Para bloquear otros)  |

## 5. Email (SMTP)

Si `EMAIL_MODE=smtp`, todas las siguientes pasan a ser **OBLIGATORIAS**:

| Variable          | Local Default | Producción        | Notas                  |
| :---------------- | :------------ | :---------------- | :--------------------- |
| `EMAIL_MODE`      | `log`         | `smtp`            | Activa el envío real   |
| `EMAIL_SMTP_HOST` | -             | `smtp.grid.com`   | Requerido si mode=smtp |
| `EMAIL_SMTP_USER` | -             | `apikey`          | Requerido si mode=smtp |
| `EMAIL_SMTP_PASS` | -             | `...`             | Requerido si mode=smtp |
| `EMAIL_SMTP_FROM` | -             | `soporte@app.com` | Evita spam folders     |

---

## Resumen de Setup en Producción

Al desplegar (en Render, AWS, DigitalOcean), asegúrate de definir **EXCLUSIVAMENTE** estas variables en el panel de control del servidor:

```bash
# Básico
NODE_ENV=production
APP_PORT=3000

# DB
PGHOST=...
PGUSER=...
PGPASSWORD=...
PGDATABASE=...
PGSSL=true

# Seguridad
SESSION_SECRETS=GeneraUnaCadenaLargaAleatoriaDeVerdad
CORS_ORIGINS=https://tu-dominio-frontend.com

# (Opcional) Si envías emails
EMAIL_MODE=smtp
EMAIL_SMTP_HOST=...
EMAIL_SMTP_USER=...
EMAIL_SMTP_PASS=...
```

Todas las demás (`APP_LANG`, `AUTH_LOGIN_ID`, etc.) pueden omitirse si te sirven los defaults.
