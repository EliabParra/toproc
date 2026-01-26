# Herramientas CLI (CLI Tools)

El framework incluye scripts para facilitarte la vida. Aquí te explicamos los más útiles.

## Generador de BOs (`npm run bo`)

No pierdas tiempo creando carpetas y archivos a mano.

### Crear un nuevo BO

```bash
npm run bo new Products
```

Esto crea `BO/Products` con todos los archivos necesarios (`BO`, `Service`, `Repository`, `schemas`).

## Mantenimiento

### Verificar Salud del Código (`npm run verify`)

Corre una serie de chequeos para asegurar que tu código está limpio y no tiene errores de tipos.

```bash
npm run verify
```

Incluye:

- Limpieza de cache (`clean`)
- Verificación de tipos (`typecheck`)
- Linter (`lint`)
- Tests (`test`)
- Build de prueba (`build`)

### Generar Documentación (`npm run docs:gen`)

Lee tu código y genera un sitio web con la documentación técnica (JSDoc).

```bash
npm run docs:gen
```

El resultado estará en `docs/api/index.html`.
