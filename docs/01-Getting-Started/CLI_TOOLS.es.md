# Herramientas CLI (Resumen)

ToProccess incluye varios scripts para automatizar tu flujo de trabajo.

## Índice de Herramientas Profundas

Hemos creado documentación exhaustiva para las herramientas más complejas:

1.  **[Generador de BOs (pnpm run bo)](CLI_BO.es.md)**
    Aprende a crear módulos, servicios y repositorios automáticamente con un solo comando.

2.  **[CLI de Base de Datos (pnpm run db)](CLI_DB.es.md)**
    La herramienta central para gestionar esquemas, sincronizar BOs, y mantener la BD al día con el equipo.

---

## Otras Herramientas Importantes

### Verificador de Salud (`pnpm run verify`)

El guardián de la calidad. Ejecútalo antes de cada commit.

**Ciclo de Ejecución**:

1.  `clean`: Limpia residuos.
2.  `typecheck`: Valida TypeScript estricto.
3.  `build`: Compila a JS.
4.  `smoke-dist`: Prueba que el build arranca.
5.  `test`: Pasa todos los tests unitarios.

```bash
pnpm run verify
```

### Generador de Documentación de Negocio (`pnpm run docs:bo`)

Genera automáticamente un índice de todos los **Business Objects** y transacciones disponibles en tu sistema.

```bash
pnpm run docs:bo
```

- **Salida**: `docs/05-Guides/BO_INDEX.md`
- **Uso**: Ejecútalo tras crear nuevos BOs para mantener la documentación al día.

### Playground Interactivo (`pnpm run playground`)

Prueba tus reglas de validación (Zod) interactivamente sin necesidad de Postman ni de levantar el servidor.

```bash
pnpm run playground
```

- **Comandos**: `auth.login {"email":"x", "password":"123"}`
- **Beneficio**: Feedback inmediato sobre si tus schemas son correctos.

### Auditor de Código (`pnpm run audit`)

Escanea tu código fuente buscando malas prácticas arquitectónicas.

```bash
pnpm run audit
```

- **Reglas**: Prohíbe `console.log` (usa `this.log`), acceso directo a `req.body`, imports profundos, etc.
- **CI/CD**: Si encuentra errores, falla el build.

### Snippets de VSCode

El proyecto incluye configuración para **Auto-completado Inteligente**.

En cualquier archivo `.ts`, escribe:

- `tp-bo`: Crea la estructura base de una clase Business Object.
- `tp-bo-method`: Agrega un método transaccional a un BO existente.
- `tp-schema`: Crea un esquema Zod estándar.
- `tp-service`: Crea un servicio con dependencias inyectadas.
- `tp-repo-method`: Crea un método de acceso a BD.
- `tp-test`: Crea una suite de tests (Node Test Runner).
- `tp-log`: Inserta una línea de log estándar.
