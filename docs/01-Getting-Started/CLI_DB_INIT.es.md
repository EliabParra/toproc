# CLI Deep Dive: Database Initializer (`npm run db:init`)

Este script es el corazón de la infraestructura. No solo "crea tablas", sino que orquesta todo el entorno inicial del proyecto.

## ¿Qué hace paso a paso?

Cuando ejecutas `npm run db:init`, el script `scripts/db-init/index.ts` toma el control y realiza estas 4 fases críticas:

### Fase 1: Configuración (`ConfigBuilder`)

1.  Lee argumentos de línea de comandos (flags).
2.  Pregunta interactivamente (prompts) si faltan datos críticos y no estás en modo Non-Interactive.
3.  Valida la configuración final.

### Fase 2: Conexión (`Database`)

Intenta conectar a PostgreSQL usando las variables de entorno.

- Si falla, te dice exactamente qué credenciales intentó usar (Host, Port, User).
- Esto ahorra horas de debugging de "¿Por qué no conecta?".

### Fase 3: Ejecución de Esquemas (`Executor`)

Corre scripts SQL idempotentes (seguros de correr varias veces).

1.  **Base Schema**: Tablas vitales del sistema.
2.  **Auth Schema**: (Opcional) Crea tablas `users`, `profiles`, `sessions` si la autenticación está habilitada.
3.  **Audit Schema**: Crea tabla `audit_log` para el sistema de auditoría.

### Fase 4: Generadores (`Generators`)

Magia que ocurre después de la DB.

1.  **.env Generator**: Si detecta que no tienes `.env`, crea uno basado en `.env.example`.
2.  **Docs Generator**: (Experimental) Puede inspeccionar tu BD y generar documentación Markdown de tus tablas.

---

## Flags y Opciones

```bash
npm run db:init -- [opciones]
```

| Flag           | Descripción                                                  | Uso Típico                            |
| :------------- | :----------------------------------------------------------- | :------------------------------------ |
| `--dry-run`    | Simula todo sin tocar la base de datos ni archivos.          | Ver qué pasaría en Producción.        |
| `--force`      | (Peligroso) Fuerza la recreación de tablas destructivamente. | Resetear entorno local.               |
| `--no-auth`    | Salta la creación de tablas de autenticación.                | Microservicio que no maneja usuarios. |
| `--yes` / `-y` | Modo "Non-Interactive". Acepta todos los defaults.           | Scripts de CI/CD (GitHub Actions).    |

---

## Resolución de Problemas

### "Connection Refused"

- **Causa**: Postgres no está corriendo o el puerto 5432 está bloqueado.
- **Solución**: Abre pgAdmin y verifica que puedes conectar.

### "Authentication Failed"

- **Causa**: Password incorrecto en `.env`.
- **Solución**: Edita `.env` y asegúrate de que `PGPASSWORD` es correcto.

### "Database does not exist"

- **Causa**: Intentas conectar a una DB que no has creado.
- **Solución**: Ejecuta `CREATE DATABASE toproc;` en tu SQL shell antes de correr el script.

---

## Archivos Clave

Si necesitas modificar qué tablas se crean, estos son los archivos que debes tocar:

- `scripts/db-init/schema/base.ts`: Tablas generales.
- `scripts/db-init/schema/auth.ts`: Tablas de usuarios/login.
- `scripts/db-init/schema/audit.ts`: Tablas de log.
