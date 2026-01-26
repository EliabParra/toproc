# Instalación (Installation)

Sigue estos pasos para preparar tu entorno de desarrollo.

## 1. Requisitos Previos

Antes de empezar, asegúrate de tener instalado:

1.  **Node.js** (Versión 20 o superior)
    - [Descargar Node.js](https://nodejs.org/)
    - Verifica con: `node -v`

2.  **PostgreSQL** (Versión 14 o superior)
    - [Descargar PostgreSQL](https://www.postgresql.org/download/)
    - Asegúrate de tener las credenciales (usuario/password) a mano.

3.  **Git**
    - [Descargar Git](https://git-scm.com/)

## 2. Clonar el Repositorio

Abre tu terminal y ejecuta:

```bash
git clone <url-del-repositorio>
cd nodejs-backend-architecture
```

## 3. Instalar Dependencias

Este proyecto usa `npm` para gestionar dependencias.

```bash
npm install
```

> **Nota**: Si ves advertencias sobre vulnerabilidades, puedes ejecutar `npm audit fix`, pero ten cuidado de no romper versiones.

## Siguiente Paso

Una vez instalado todo, procede a configurar las [Variables de Entorno](ENVIRONMENT.es.md).
