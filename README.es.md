<div align="center">

<picture>
	<source media="(prefers-color-scheme: dark)" srcset="assets/branding/toproc-logo.light.svg" />
	<img alt="Toproc" src="assets/branding/toproc-logo.dark.svg" width="150" />
</picture>

_**ToProccess core**: tx-driven secure dispatch backend._

[![Node.js (ESM)](https://img.shields.io/badge/Node.js-ESM-3c873a?style=for-the-badge)](#)
[![Express](https://img.shields.io/badge/Express-5.x-000000?style=for-the-badge)](#)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-required-336791?style=for-the-badge)](#)
[![Tests](https://img.shields.io/badge/Tests-175%20passing-2f6feb?style=for-the-badge)](#)
[![CI](https://img.shields.io/github/actions/workflow/status/EliabParra/toproc/ci.yml?branch=master&style=for-the-badge)](https://github.com/EliabParra/toproc/actions/workflows/ci.yml)
[![Licencia: MIT](https://img.shields.io/badge/License-MIT-2f6feb?style=for-the-badge)](LICENSE)

</div>

**English:** see [README.md](README.md)

Toproc es una arquitectura backend moderna y **Transaction-Oriented**, diseñada para aplicaciones que requieren alta seguridad, trazabilidad granular y "Zero-Magic".

A diferencia de los frameworks MVC tradicionales, Toproc no expone recursos (Endpoints REST), sino **Intenciones de Negocio**.

## ✨ Características Principales

### 🛡️ Seguridad por Diseño (Transaction-Oriented)

- **Single Entry Point**: Todo el tráfico pasa por `POST /toProccess`.
- **Deny by Default**: Si una Transacción (ej. `1001`) no está mapeada y autorizada en DB, no existe.
- **Auditoría Granular**: Sabemos exactamente _quién_, _cuándo_ y _con qué_ parámetros intentó ejecutar cada acción.

### 🧩 Arquitectura Robusta & DI

- **TypeScript Strict**: Tipado estático en todo el ciclo de vida (Zod -> Service -> Repository).
- **Inyección de Dependencias**: Los Business Objects (`BO`) reciben sus dependencias (`db`, `email`, `log`) vía `BOService`, facilitando el testing unitario.
- **Abstracciones Inteligentes**:
    - `BaseBO`: Maneja el flujo de validación/ejecución (`.exec()`).
    - `CrudBO`: Implementa operaciones CRUD automáticamente.
    - `BOService`: Provee acceso tipado a recursos core.
- **Zod Deep Integration**: Validación de entrada, tipado de `.env` y saneamiento automático.

### 🔋 "Batteries Included"

- **Auth Module Completo**: Login, Registro, Email Verification (OTP), Password Reset y CSRF Protection.
- **Infraestructura Lista**: Sesiones en Postgres, Rate Limiting, CORS seguro y Logs estructurados (JSON/Text).
- **CLI Tools**: Generadores de código (`npm run bo`), inicializadores de DB y scripts de mantenimiento.

---

## 🚀 Inicio Rápido

### 1. Requisitos

- Node.js 20+
- PostgreSQL 14+

### 2. Instalación

```bash
git clone ...
npm install
```

### 3. Configuración

Copia el archivo de ejemplo y ajusta tus credenciales de Postgres.

```bash
cp .env.example .env
```

> **Nota**: El sistema no arrancará si detecta una configuración inválida (Zod Validation).

### 4. Inicialización

Crea las tablas del sistema (`security`, `session`, `audit`).

```bash
npm run db
```

### 5. Arrancar

```bash
npm run dev
```

---

## 📚 Documentación Maestra (ES)

### 🚀 01. Primeros Pasos

- [Introducción y Estructura](docs/00-Introduction/FILE_STRUCTURE.es.md)
- [Instalación y Setup](docs/01-Getting-Started/MANUAL_INSTALLATION.es.md)
- [Configuración de Entorno (.env)](docs/01-Getting-Started/ENVIRONMENT.es.md)
- [Tu Primer Business Object](docs/05-Guides/CREATE_NEW_MODULE.es.md)
- [CLI Tools (db, bo)](docs/01-Getting-Started/CLI_TOOLS.es.md)

### 🏛️ 02. Arquitectura

- [Sistema de Seguridad y Permisos](docs/02-Architecture/SECURITY_SYSTEM.es.md)
- [El Dispatcher (Core)](docs/02-Architecture/DISPATCHER_CORE.es.md)
- [Inyección de Dependencias](docs/02-Architecture/DEPENDENCY_INJECTION.es.md)
- [Gestión de Sesiones](docs/02-Architecture/SESSIONS.es.md)

### 🧠 03. Conceptos Core

- [Module de Autenticación (Auth)](docs/03-Core-Concepts/AUTH_MODULE.es.md)
- [Sistema de Validación (Zod)](docs/03-Core-Concepts/VALIDATION_SYSTEM.es.md)
- [Estrategia de Errores](docs/03-Core-Concepts/EXCEPTION_STRATEGY.es.md)
- [Business Objects (BaseBO)](docs/03-Core-Concepts/BUSINESS_OBJECTS.es.md)

### 🏗️ 04. Infraestructura

- [Capa de Base de Datos (Pg)](docs/04-Infrastructure/DATABASE_LAYER.es.md)
- [Sistema de Logging & Auditoría](docs/04-Infrastructure/LOGGING_SYSTEM.es.md)
- [Servicio de Email](docs/04-Infrastructure/EMAIL_SERVICE.es.md)

### 🔌 06. API Reference

- [Estándar de Mensajería](docs/06-API-Reference/API_REFERENCE.es.md)
- [Endpoints y Códigos HTTP](docs/06-API-Reference/API_REFERENCE.es.md)

### 🎨 07. Frontend Adapters

- [Patrón de Adaptador (General)](docs/07-Frontend-Adapters/ADAPTER_PATTERN.es.md)
- [Guía React (Hooks)](docs/07-Frontend-Adapters/REACT_GUIDE.es.md)
- [Guía Angular (Service)](docs/07-Frontend-Adapters/ANGULAR_GUIDE.es.md)
- [Guía Vue (Composable)](docs/07-Frontend-Adapters/VUE_GUIDE.es.md)

---

## 🛠️ Scripts Disponibles

| Script                 | Descripción                                      |
| :--------------------- | :----------------------------------------------- |
| `npm run dev`          | Modo desarrollo con `nodemon` (Hot Reload).      |
| `npm start`            | Modo producción (Ejecuta `dist/index.js`).       |
| `npm run verify`       | **Quality Gate**: Typecheck + Build + Tests.     |
| `npm run db`           | CLI interactivo de BD (sync, seed, reset).       |
| `npm run config:check` | Valida el archivo `.env` sin arrancar el server. |
| `npm run bo <cmd>`     | CLI para crear BOs: `new`, `sync`, `list`.       |
| `npm run docs:gen`     | Genera documentación API (TypeDoc).              |
| `npm run hashpw`       | Utilidad para hashear passwords manualmente.     |

---

## Licencia

MIT. Ver [LICENSE](LICENSE).
