# Guía de Inicio Rápido

## Prerrequisitos

- **Node.js** >= 18.x
- **PostgreSQL** >= 14
- **npm** o **pnpm**

## Instalación

```bash
# Clonar el repositorio
git clone <repo-url>
cd nodejs-backend-architecture

# Instalar dependencias
npm install

# Copiar configuración de ejemplo
cp config.example.json config.json
```

## Configuración

### 1. Base de Datos

Edita `config.json` con tus credenciales de PostgreSQL:

```json
{
    "app": {
        "name": "toproc",
        "lang": "es"
    },
    "database": {
        "host": "localhost",
        "port": 5432,
        "user": "tu_usuario",
        "password": "tu_password",
        "database": "tu_base_de_datos"
    },
    "session": {
        "secret": "un-secreto-seguro-aqui"
    }
}
```

### 2. Inicializar Base de Datos

```bash
# Crear tablas necesarias
npm run db:init
```

### 3. Ejecutar en Desarrollo

```bash
npm run dev
```

El servidor estará disponible en `http://localhost:3000`.

---

## Verificar Instalación

### Health Check

```bash
curl http://localhost:3000/health
```

Respuesta esperada:

```json
{
    "ok": true,
    "name": "toproc",
    "uptimeSec": 5,
    "time": "2024-01-25T12:00:00.000Z"
}
```

### Ready Check

```bash
curl http://localhost:3000/ready
```

Respuesta esperada:

```json
{
    "ok": true
}
```

---

## Primera Transacción

Las transacciones se envían a `POST /toProccess`:

```bash
curl -X POST http://localhost:3000/toProccess \
  -H "Content-Type: application/json" \
  -d '{"tx": "AUTH_LOGIN", "identifier": "usuario@email.com", "password": "secreto123"}'
```

---

## Scripts Disponibles

| Script                | Descripción                                |
| --------------------- | ------------------------------------------ |
| `npm run dev`         | Servidor en modo desarrollo con hot-reload |
| `npm run build`       | Compilar TypeScript a JavaScript           |
| `npm start`           | Ejecutar versión compilada                 |
| `npm test`            | Ejecutar tests                             |
| `npm run verify`      | Typecheck + build + tests                  |
| `npm run db:init`     | Inicializar esquema de BD                  |
| `npm run bo <nombre>` | Generar nuevo Business Object              |

---

## Próximos Pasos

1. Ver [Crear Business Objects](./CREATING_BOS.md) para agregar funcionalidad
2. Consultar [Arquitectura](./ARCHITECTURE.md) para entender el sistema
3. Revisar ejemplos en `src/BO/` para patrones recomendados
