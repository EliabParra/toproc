# Guía de Instalación Definitiva (Ultimate Installation Guide)

> **Tiempo estimado**: 10 a 15 minutos.
> **Nivel**: Principiante.

Esta guía asume que estás empezando desde cero, quizás con una computadora nueva.

## 1. Requisitos del Sistema

Antes de copiar una sola línea de código, verifica esto.

| Herramienta    | Versión Minima | Comando de Verificación | ¿Por qué la necesito?                                         |
| :------------- | :------------- | :---------------------- | :------------------------------------------------------------ |
| **Node.js**    | v20.x (LTS)    | `node -v`               | Es el motor que ejecuta nuestro código JavaScript/TypeScript. |
| **pnpm**       | v9.x           | `pnpm -v`               | El gestor de paquetes optimizado.                             |
| **PostgreSQL** | v14.x          | `psql --version`        | Dónde guardaremos los datos (Usuarios, Transacciones).        |
| **Git**        | v2.x           | `git --version`         | Para descargar este código y guardar el tuyo.                 |

### ¿Cómo instalar lo que me falta?

#### Windows

Recomendamos usar el instalador oficial de [nodejs.org](https://nodejs.org/) y [postgresql.org](https://www.postgresql.org/).
_Tip profesional_: Instala `pgAdmin` junto con Postgres para ver tus tablas visualmente.

#### MacOS

Si tienes Homebrew:

```bash
brew install node postgresql git
```

#### Linux (Ubuntu/Debian)

```bash
sudo apt update
sudo apt install nodejs pnpm postgresql git
```

---

## 2. Preparando el Código

Ve a la carpeta donde guardas tus proyectos (ej. `C:\Users\TuUsuario\Dev` o `~/Dev`).

### Clonar el Repositorio

```bash
git clone <url-del-repositorio>
cd nodejs-backend-architecture
```

### Entendiendo `pnpm install`

Cuando ejecutas el siguiente comando, `pnpm` lee el archivo `package.json`.

```bash
pnpm install
```

**¿Qué está pasando?**

1.  Descarga las dependencias de producción (`dependencies`): Express, Zod, PG.
2.  Descarga las herramientas de desarrollo (`devDependencies`): TypeScript, TypeDoc, Prettier.
3.  Crea la carpeta `node_modules`. **Nunca toques esa carpeta**.

> **Problemas comunes**:
>
> - _Error de permisos_: Intenta abrir la terminal como Administrador (Windows) o usa `sudo` (Linux/Mac).
> - _Python not found_: Ignóralo, es opcional para algunas compilaciones nativas.

---

## 3. Configuración de Base de Datos Local

Para que el proyecto funcione en tu máquina, necesitas crear una base de datos vacía.

1.  Abre `pgAdmin` o tu terminal SQL.
2.  Ejecuta este comando SQL:
    ```sql
    CREATE DATABASE "toproc";
    -- El nombre puede ser cualquiera, pero este usamos en los ejemplos.
    ```
3.  Asegúrate de saber tu usuario (usualmente `postgres`) y tu contraseña.

## Siguiente Paso

Ahora tienes el código y la base de datos lista. Pero, ¿cómo sabe el código conectarse a esa base de datos?
Vamos a configurar el [Entorno y Variables (.env)](ENVIRONMENT.es.md).
