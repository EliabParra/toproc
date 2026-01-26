# Ejecutando el Proyecto (Running the Project)

¡Todo listo! Es hora de encender los motores.

## 1. Inicializar la Base de Datos

Antes de correr el servidor por primera vez, necesitamos crear las tablas base en PostgreSQL. Nuestro framework incluye una herramienta para esto.

Ejecuta:

```bash
npm run db:init
```

Esto creará:

- Esquema `security`.
- Tablas: `users`, `profiles`, `sessions`, `audit`, etc.
- Un usuario administrador por defecto (si así está configurado).

## 2. Modo Desarrollo (Development)

Para programar, usa el modo desarrollo. Este modo:

- Reinicia el servidor automáticamente cuando guardas cambios.
- Muestra logs bonitos y legibles.

```bash
npm run dev
```

Deberías ver algo como:

```text
[INFO] Server listening on port 3000
```

## 3. Modo Producción (Production)

En un servidor real, queremos velocidad y estabilidad.

1.  **Compilar (Build)**: Traduce TypeScript a JavaScript optimizado.

    ```bash
    npm run build
    ```

    Esto crea la carpeta `dist/`.

2.  **Iniciar (Start)**: Corre el código compilado.
    ```bash
    npm start
    ```

## 4. Verificar que funciona

Abre tu navegador en:
`http://localhost:3000/health`

Deberías ver un mensaje `OK`.

## Siguiente Paso

Con el servidor corriendo, entiende cómo funciona leyendo [Arquitectura](../02-Architecture/OVERVIEW.es.md).
