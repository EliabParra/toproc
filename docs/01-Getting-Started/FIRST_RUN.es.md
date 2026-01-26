# Primera Ejecución Detallada (Deep Dive into First Run)

Ya instalaste todo y configuraste el entorno. Ahora vamos a ver qué pasa cuando "aprietas el botón de encendido".

## 1. Inicialización de Base de Datos (`npm run db:init`)

Este comando es crítico para la primera vez.

### ¿Qué hace exactamente?

1.  **Conexión**: Se conecta a tu Postgres usando las credenciales de `.env`.
2.  **Verificación**: Revisa si ya existen tablas.
3.  **Ejecución de SQL**: Corre scripts de inicialización ubicados en `scripts/db-init/schema/`.
    - `audit.ts`: Crea tabla `audit_log`.
    - `auth.ts`: Crea tablas `users`, `profiles`, `sessions`.
    - `base.ts`: Tablas base del sistema.
4.  **Generadores**: Crea archivos dinámicos si es necesario (e.g. documentación automática de base de datos).

### Uso

```bash
npm run db:init
```

**Salida Esperada:**

```text
✅ Connected to DB
🚀 DB Init Complete
```

> **Nota**: Si falla, revisa tu `PGPASSWORD` en el archivo `.env`. El 99% de los errores son credenciales incorrectas.

---

## 2. Modo Desarrollo (`npm run dev`)

Este es el comando que usarás el 90% del tiempo.

### Características Mágicas

- **Hot Reload (Nodemon)**: No necesitas detener y reiniciar el server. Si editas un archivo y guardas (`Ctrl+S`), el servidor se reinicia solo en menos de 1 segundo.
- **TypeScript on-the-fly (`tsx`)**: Ejecuta el código `.ts` directamente sin compilar a disco. Es muy rápido.
- **Watch Mode**: Vigila carpetas clave (`src`, `BO`, `public`).

### Uso

```bash
npm run dev
```

**Verificación**:
Abre `http://localhost:3000/health`. Deberías ver: `OK`.

---

## 3. Modo Producción (`npm run build` + `npm start`)

Así es como debe correr en AWS, DigitalOcean o tu servidor real. Nunca uses `npm run dev` en producción (es lento e inseguro).

### Paso A: Compilación (`npm run build`)

Transforma tu código TypeScript (bonito pero pesado) a JavaScript estándar (feo pero rapidísimo).

- **Entrada**: carpeta `src/`, `BO/`.
- **Salida**: carpeta `dist/`.

> **¿Por qué compilar?**
> Node.js no entiende TypeScript nativamente. La compilación elimina tipos y optimiza el código.

### Paso B: Ejecución (`npm start`)

Corre el código optimizado desde la carpeta `dist/`.

```bash
npm start
```

---

## Resumen del Ciclo de Vida

1.  **Instalar** (`npm install`)
2.  **Configurar** (`.env`)
3.  **Inicializar DB** (`npm run db:init`)
4.  **Programar** (`npm run dev`)
5.  **Desplegar** (`npm run build` -> `npm start`)

## Siguiente Paso

Ya sabes correrlo. Ahora aprende a usar las herramientas de poder en [CLI Tools](CLI_TOOLS.es.md).
