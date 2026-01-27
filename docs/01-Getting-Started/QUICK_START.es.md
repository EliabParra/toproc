# 🚀 Guía de Inicio Rápido (Quick Start)

Bienvenido a **ToProccess Framework**. Hemos diseñado dos caminos para que empieces a desarrollar, dependiendo de tus preferencias y entorno.

## 🛤️ Elige tu Camino

| Característica    | 🐳 Opción A: Docker (Recomendada) | 🛠️ Opción B: Manual (Clásica)     |
| :---------------- | :-------------------------------- | :-------------------------------- |
| **Requisitos**    | Solo Docker Desktop.              | Node.js v20, Postgres v15, Git.   |
| **Configuración** | Automática (0 configuración).     | Manual (Variables env, DB local). |
| **Entorno**       | Idéntico a Producción (Linux).    | Depende de tu OS (Windows/Mac).   |
| **Ideal para**    | Iniciar rápido, equipos, Windows. | Control total, bajos recursos.    |

---

## 🐳 Opción A: Docker (La Vía Rápida)

Este es el estándar del proyecto. No necesitas instalar Node.js ni Postgres en tu máquina.

### 1. Prerrequisitos

- Tener **Docker Desktop** instalado y corriendo.

### 2. Iniciar el Entorno

Ejecuta este comando en la raíz del proyecto:

```bash
docker-compose up -d
```

> _Esto descargará las imágenes y levantará la API y la Base de Datos._

### 3. Inicializar Base de Datos (Solo la primera vez)

Una vez que los contenedores estén arriba (verde en Docker Desktop), ejecuta:

```bash
docker-compose exec api npm run db:init -- --yes --profile development
```

### 4. ¡A Desarrollar!

- Tu API está en: `http://localhost:3000`
- **Hot Reload**: Edita cualquier archivo en `src/` y guarda. El servidor se reiniciará automáticamente.
- **Logs**: Para ver qué pasa, usa `docker-compose logs -f`.

---

## 🛠️ Opción B: Instalación Manual

Si prefieres tener control total y ejecutar las herramientas nativamente en tu sistema operativo.

### 1. Prerrequisitos

Necesitas instalar manualmente:

- Node.js v20 (LTS)
- PostgreSQL v15+

### 2. Configuración

Sigue la guía detallada paso a paso:
👉 **[Ir a Guía de Instalación Manual](INSTALLATION.es.md)**

---

## Workflow de Desarrollo (Día a Día)

### Comandos Comunes

| Acción              | 🐳 Docker                               | 🛠️ Manual        |
| :------------------ | :-------------------------------------- | :--------------- |
| **Iniciar Server**  | `docker-compose up -d`                  | `npm run dev`    |
| **Ver Logs**        | `docker-compose logs -f`                | (En tu terminal) |
| **Crear BO/Schema** | `docker-compose exec api npm run bo`    | `npm run bo`     |
| **Tests**           | `docker-compose exec api npm test`      | `npm test`       |
| **Auditoría**       | `docker-compose exec api npm run audit` | `npm run audit`  |

### Tips Pro

- **Entrar al contenedor**: Si necesitas ejecutar muchos comandos seguidos en Docker:
    ```bash
    docker-compose exec api sh
    # Ahora estás dentro de Linux. Ejecuta 'npm run ...' directamente.
    ```
