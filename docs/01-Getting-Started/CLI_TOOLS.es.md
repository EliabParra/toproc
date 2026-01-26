# Herramientas CLI (Resumen)

ToProccess incluye varios scripts para automatizar tu flujo de trabajo.

## Índice de Herramientas Profundas

Hemos creado documentación exhaustiva para las herramientas más complejas:

1.  **[Generador de BOs (npm run bo)](CLI_BO.es.md)**
    Aprende a crear módulos, servicios y repositorios automáticamente con un solo comando.

2.  **[Inicializador de DB (npm run db:init)](CLI_DB_INIT.es.md)**
    Descubre cómo bootstrapear tu base de datos, configurar esquemas y solucionar problemas de conexión.

---

## Otras Herramientas Importantes

### Verificador de Salud (`npm run verify`)

El guardián de la calidad. Ejecútalo antes de cada commit.

**Ciclo de Ejecución**:

1.  `clean`: Limpia residuos.
2.  `typecheck`: Valida TypeScript estricto.
3.  `build`: Compila a JS.
4.  `smoke-dist`: Prueba que el build arranca.
5.  `test`: Pasa todos los tests unitarios.

```bash
npm run verify
```

### Generador de Documentación Técnica (`npm run docs:gen`)

Si escribes comentarios JSDoc en tu código, esta herramienta genera un sitio web navegable.

```bash
npm run docs:gen
```

El resultado se guarda en `docs/api/`. Útil para ver diagramas de clases y referencias de métodos de todo el framework.
