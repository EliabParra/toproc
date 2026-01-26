# Environment & Configuration Guide

ToProccess follows the **Twelve-Factor App** methodology, storing configuration in environment variables.

## 1. Mandatory vs Optional

Although almost all variables have a default value (to ease local development), in **PRODUCTION**, certain variables are mandatory for security.

The server includes **Zod** validation at startup. If it detects an invalid combination (e.g., `EMAIL_MODE=smtp` without `EMAIL_SMTP_HOST`), it will refuse to start.

---

## 2. Web Server (Server Exclusive)

These variables define how the server listens for requests.

| Variable          | Local Default | Production          | Mandatory?                           |
| :---------------- | :------------ | :------------------ | :----------------------------------- |
| `NODE_ENV`        | `development` | `production`        | **YES** (Changes logs, security)     |
| `APP_PORT`        | `3000`        | (Assigned by Cloud) | **YES**                              |
| `APP_HOST`        | `localhost`   | `0.0.0.0`           | **YES** (In Docker/Render)           |
| `APP_TRUST_PROXY` | `0`           | `1`                 | **YES** (If using Load Balancer/SSL) |

## 3. Database (Credentials)

**⚠️ CRITICAL**: Never commit these, only put them in the hosting dashboard.

| Variable     | Local Default | Production         | Mandatory?          |
| :----------- | :------------ | :----------------- | :------------------ |
| `PGHOST`     | `localhost`   | `db.render.com`... | **YES**             |
| `PGUSER`     | `postgres`    | `app_user`         | **YES**             |
| `PGPASSWORD` | `""`          | `XyZ123...`        | **YES**             |
| `PGDATABASE` | `postgres`    | `my_app_db`        | **YES**             |
| `PGSSL`      | `false`       | `true`             | Depends on provider |

## 4. Security & Sessions (Server Exclusive)

| Variable                | Local Default | Production          | Mandatory?                |
| :---------------------- | :------------ | :------------------ | :------------------------ |
| `SESSION_SECRETS`       | `secret`      | `a8f93...`          | **YES** (Min 32 chars)    |
| `SESSION_COOKIE_SECURE` | `false`       | `true`              | Recommended               |
| `CORS_ORIGINS`          | -             | `https://myweb.com` | **YES** (To block others) |

## 5. Email (SMTP)

If `EMAIL_MODE=smtp`, all of the following become **MANDATORY**:

| Variable          | Local Default | Production        | Notes                  |
| :---------------- | :------------ | :---------------- | :--------------------- |
| `EMAIL_MODE`      | `log`         | `smtp`            | Activates real sending |
| `EMAIL_SMTP_HOST` | -             | `smtp.grid.com`   | Required if mode=smtp  |
| `EMAIL_SMTP_USER` | -             | `apikey`          | Required if mode=smtp  |
| `EMAIL_SMTP_PASS` | -             | `...`             | Required if mode=smtp  |
| `EMAIL_SMTP_FROM` | -             | `support@app.com` | Avoids spam folders    |

---

## Production Setup Summary

When deploying (on Render, AWS, DigitalOcean), make sure to define **EXCLUSIVELY** these variables in the server's control panel:

```bash
# Basic
NODE_ENV=production
APP_PORT=3000

# DB
PGHOST=...
PGUSER=...
PGPASSWORD=...
PGDATABASE=...
PGSSL=true

# Security
SESSION_SECRETS=GenerateARealLongRandomStringHere
CORS_ORIGINS=https://your-frontend-domain.com

# (Optional) If sending emails
EMAIL_MODE=smtp
EMAIL_SMTP_HOST=...
EMAIL_SMTP_USER=...
EMAIL_SMTP_PASS=...
```

All others (`APP_LANG`, `AUTH_LOGIN_ID`, etc.) can be omitted if defaults work for you.
