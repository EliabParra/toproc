# Variables de Entorno (.env)

El archivo `.env` controla cómo se comporta la aplicación en tu computadora. **NUNCA debes subir este archivo a Git**, ya que contiene contraseñas secretas.

## Configuración Inicial

Copia el archivo de ejemplo para crear tu propio `.env`:

```bash
cp .env.example .env
# En Windows (PowerShell): Copy-Item .env.example .env
```

## Variables Principales

Aquí explicamos para qué sirve cada cosa:

### Aplicación

- `APP_PORT`: Puerto donde corre el servidor (Default: `3000`).
- `APP_LANG`: Idioma por defecto (`es` o `en`).

### Base de Datos

Tienes dos formas de configurar PostgreSQL:

1.  **Opción A (Recomendada Local)**: Variables individuales.

    ```properties
    PGHOST=localhost
    PGPORT=5432
    PGDATABASE=curso-node
    PGUSER=postgres
    PGPASSWORD=tu_password
    ```

2.  **Opción B**: Cadena de conexión completa (URL).
    ```properties
    DATABASE_URL=postgres://usuario:password@host:port/db
    ```

### Sesiones

- `SESSION_SECRETS`: Una frase secreta usada para firmar las cookies. **Cámbiala en producción**.

## Siguiente Paso

Con las variables listas, es hora de [Ejecutar el Proyecto](FIRST_RUN.es.md).
