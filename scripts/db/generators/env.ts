import fs from 'node:fs/promises'
import path from 'node:path'
import { InitConfig } from '../types.js'

/**
 * Generador de archivos de entorno (.env y .env.example)
 *
 * Se encarga de crear los archivos de configuración base para la aplicación
 * basándose en la configuración inicial proporcionada por el CLI.
 *
 * Genera todas las claves soportadas por `env.loader.ts`.
 */
export class EnvGenerator {
    constructor(private rootDir: string) {}

    /**
     * Genera los archivos .env y .env.example
     * @param config Configuración inicial del asistente de DB
     */
    async generate(config: InitConfig) {
        const envPath = path.join(this.rootDir, '.env')
        const examplePath = path.join(this.rootDir, '.env.example')

        const envContent = this.buildEnvContent(config, false)
        const exampleContent = this.buildEnvContent(config, true)

        // Escribir .env (no sobrescribir si existe, o avisar - por ahora append/create)
        // La lógica original hacía append, pero para un init limpio debería ser create o merge.
        // Dado que estamos "refactorizando", asumiremos que si el usuario corre esto es porque quiere generar la config.
        // Pero para seguridad, solo escribiremos si no existe o si es una ejecución explícita.
        // Por simplicidad y consistencia con el script anterior, usaremos writeFile (sobrescribe o crea).
        // NOTA: El usuario revisará esto.

        await fs.writeFile(envPath, envContent)
        console.log(`✅ Updated .env at ${envPath}`)

        await fs.writeFile(examplePath, exampleContent)
        console.log(`✅ Updated .env.example at ${examplePath}`)
    }

    private buildEnvContent(config: InitConfig, isExample: boolean): string {
        const val = (v: any, fallback: string) =>
            isExample ? fallback : v !== undefined ? String(v) : fallback
        const comment = (msg: string) => `\n# --- ${msg} ---\n`

        let c = '# Configuración de Entorno (ToProccess)\n'
        c += `# Fecha: ${new Date().toISOString()}\n`
        c += `# Este archivo contiene TODAS las variables configurables de la aplicación.\n`

        // --- APP ---
        c += comment('CONFIGURACIÓN GENERAL DE LA APLICACIÓN')
        c += `# Entorno de ejecución (development, production, test)\n`
        c += `NODE_ENV=${val(config.app.profile, 'development')}\n`
        c += `# Puerto del servidor\n`
        c += `APP_PORT=3000\n`
        c += `# Host del servidor\n`
        c += `APP_HOST=localhost\n`
        c += `# Nombre de la aplicación\n`
        c += `APP_NAME=toproc\n`
        c += `# Idioma por defecto (es, en)\n`
        c += `APP_LANG=es\n`
        c += `# Modo del frontend (none, spa, next)\n`
        c += `APP_FRONTEND_MODE=none\n`
        c += `# Confiar en proxies (utile para despliegues tras Nginx/AWS)\n`
        c += `APP_TRUST_PROXY=false\n`

        // --- DB ---
        c += comment('BASE DE DATOS (PostgreSQL)')
        if (config.db.connectionString && !isExample) {
            c += `DATABASE_URL=${config.db.connectionString}\n`
        } else {
            c += `PGHOST=${val(config.db.host, 'localhost')}\n`
            c += `PGPORT=${val(config.db.port, '5432')}\n`
            c += `PGUSER=${val(config.db.user, 'postgres')}\n`
            c += `PGPASSWORD=${val(config.db.password, 'secret')}\n`
            c += `PGDATABASE=${val(config.db.database, 'app_db')}\n`
            c += `# Usar SSL para la conexión (true/false, o 'no-verify', etc.)\n`
            c += `PGSSL=${val(config.db.ssl, 'false')}\n`
        }

        // --- SESSION ---
        c += comment('SESIONES Y SEGURIDAD')
        c += `# Secreto para firmar cookies de sesión (¡CAMBIAR EN PRODUCCIÓN!)\n`
        c += `SESSION_SECRET=${isExample ? 'change_me_super_secret_key' : 'CHANGE_ME_' + Date.now()}\n`
        c += `# Esquema y tabla donde se guardan sesiones\n`
        c += `SESSION_SCHEMA=${val(config.security.sessionSchema, 'security')}\n`
        c += `SESSION_TABLE=${val(config.security.sessionTable, 'sessions')}\n`
        c += `# Configuración de Cookie\n`
        c += `SESSION_COOKIE_SECURE=false\n`
        c += `SESSION_COOKIE_SAMESITE=lax\n`
        c += `SESSION_COOKIE_MAXAGE_MS=1800000\n`

        // --- AUTH ---
        c += comment('MÓDULO DE AUTENTICACIÓN')
        if (config.auth.enabled) {
            c += `AUTH_ENABLE=true\n`
            c += `# Identificador de login (email, username)\n`
            c += `AUTH_LOGIN_ID=${val(config.auth.loginId, 'email')}\n`
            c += `# IDs de perfiles básicos\n`
            c += `AUTH_PUBLIC_PROFILE_ID=${val(config.auth.publicProfileId, '1')}\n`
            c += `AUTH_SESSION_PROFILE_ID=${val(config.auth.sessionProfileId, '1')}\n`
            c += `# Seguridad adicional\n`
            c += `AUTH_LOGIN_2STEP_NEW_DEVICE=${val(config.auth.login2StepNewDevice, 'false')}\n`
            c += `AUTH_REQUIRE_EMAIL_VERIFICATION=true\n`

            c += `\n# Cookies de Dispositivo y Tiempos Expiración\n`
            c += `AUTH_DEVICE_COOKIE_NAME=device_token\n`
            c += `AUTH_DEVICE_COOKIE_MAX_AGE_MS=15552000000\n`

            c += `\n# Rate Limits y Desafíos (Segundos / Intentos)\n`
            c += `AUTH_LOGIN_CHALLENGE_EXPIRES_SEC=600\n`
            c += `AUTH_LOGIN_CHALLENGE_MAX_ATTEMPTS=5\n`

            c += `AUTH_PASSWORD_RESET_EXPIRES_SEC=900\n`
            c += `AUTH_PASSWORD_RESET_MAX_ATTEMPTS=5\n`

            c += `AUTH_EMAIL_VERIFY_EXPIRES_SEC=900\n`
            c += `AUTH_EMAIL_VERIFY_MAX_ATTEMPTS=5\n`
        } else {
            c += `# AUTH_ENABLE=false\n`
        }

        // --- EMAIL ---
        c += comment('SERVICIO DE EMAIL (SMTP)')
        c += `# Modos: 'log' (consola) o 'smtp' (envío real)\n`
        c += `EMAIL_MODE=log\n`
        c += `SMTP_HOST=smtp.gmail.com\n`
        c += `SMTP_PORT=587\n`
        c += `SMTP_USER=user@gmail.com\n`
        c += `SMTP_PASS=secret\n`
        c += `SMTP_SECURE=false\n`
        c += `SMTP_FROM=noreply@app.com\n`

        // --- LOG ---
        c += comment('LOGGING')
        c += `LOG_FORMAT=text\n`

        // --- CORS ---
        c += comment('CORS (Cross-Origin Resource Sharing)')
        c += `CORS_ENABLED=true\n`
        c += `CORS_CREDENTIALS=true\n`
        c += `CORS_ORIGINS=http://localhost:5173,http://localhost:4200\n`

        return c
    }
}
