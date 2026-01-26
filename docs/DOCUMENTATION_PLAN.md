# Plan de Reestructuración de Documentación (Documentation Overhaul Plan)

Este documento detalla la estructura propuesta para la documentación del sistema. El objetivo es que sea **exhaustiva, fácil de entender (para principiantes) y bilingüe (Español/Inglés)**.

## Estructura de Directorios Propuesta (`docs/`)

La documentación se organizará en carpetas numeradas para sugerir un orden de lectura lógico. Cada carpeta contendrá archivos `.md` específicos.

```text
docs/
├── 00-Introduction/           # Visión general y filosofía
│   ├── README.md              # Qué es este framework / What is this framework
│   └── FILE_STRUCTURE.md      # Explicación del árbol de archivos / File tree explained
│
├── 01-Getting-Started/        # Primeros pasos para nuevos devs
│   ├── INSTALLATION.md        # Instalación y requisitos / Setup
│   ├── ENVIRONMENT.md         # Variables de entorno (.env) explicadas
│   ├── FIRST_RUN.md           # Corriendo el proyecto (dev/prod)
│   └── CLI_TOOLS.md           # Uso de las herramientas de línea de comandos (npm run bo new, etc)
│
├── 02-Architecture/           # Cómo funciona por dentro
│   ├── OVERVIEW.md            # Diagrama C4 general y explicación de capas
│   ├── TRANSACTION_FLOW.md    # El ciclo de vida de una petición (Request -> Response)
│   ├── SECURITY_MODEL.md      # Cómo funciona la seguridad, permisos y sesiones
│   └── DEPENDENCY_INJECTION.md# Explicación del Dispatcher y carga dinámica de BOs
│
├── 03-Core-Concepts/          # Conceptos fundamentales que hay que saber
│   ├── BUSINESS_OBJECTS.md    # Qué es un BO, un Service y un Repository
│   ├── VALIDATION.md          # Cómo usar Zod y el AppValidator
│   ├── ERROR_HANDLING.md      # Gestión de errores y respuestas HTTP estandarizadas
│   └── I18N.md                # Sistema de internacionalización
│
├── 04-Infrastructure/         # Servicios base
│   ├── DATABASE.md            # Conexión, QueryExec y patrones SQL
│   ├── LOGGING.md             # Sistema de logs y auditoría
│   └── EXTERNAL_SERVICES.md   # Email, Storage, etc.
│
├── 05-Guides/                 # Tutoriales "How-To" paso a paso
│   ├── CREATE_NEW_MODULE.md   # Guía definitiva para crear un nuevo módulo (BO)
│   ├── ADD_MIDDLEWARE.md      # Cómo agregar lógica global a Express
│   └── TESTING.md             # Cómo escribir y correr tests
│
└── 06-API-Reference/          # Detalles técnicos
    ├── API_ENDPOINTS.md       # Lista de endpoints base
    └── ERROR_CODES.md         # Diccionario de códigos de error
```

---

## Estrategia de Contenido (Content Strategy)

Para cumplir con el requisito de ser "entendible por un bebé" y bilingüe:

1.  **Formato Bilingüe**:
    Cada archivo tendrá secciones claramente separadas o usaremos pestañas si el visualizador lo permitiera, pero en Markdown plano haremos bloque Español seguido de bloque Inglés, o archivos separados `README.es.md` vs `README.en.md`.
    _Recomendación_: Usar un solo archivo con encabezados claros en ambos idiomas o **archivos separados por idioma (e.g., `INSTALLATION.es.md` y `INSTALLATION.en.md`)** para mantener la limpieza.

    > **Propuesta**: Usar sufijos `.es.md` y `.en.md`. Así cada archivo es limpio y nativo.

2.  **Nivel de Detalle**:
    - **Nada de suposiciones**: Explicar qué es un "Middleware", qué es "Inyección de dependencias", por qué usamos "BOs".
    - **Diagramas**: Uso intensivo de Mermaid para flujos.
    - **Ejemplos**: Código real para cada concepto.
    - **Analogías**: Usar analogías simples para explicar conceptos complejos (e.g., "El Dispatcher es como un recepcionista de hotel...").

## Plan de Ejecución

1.  **Limpieza**: Mover documentación actual a `docs/legacy_backup/`.
2.  **Estructura**: Crear el árbol de directorios vacío.
3.  **Core**: Escribir `00-Introduction` y `02-Architecture` (Base fundamental).
4.  **Usage**: Escribir `01-Getting-Started` y `05-Guides` (Lo que más usará la gente).
5.  **Reference**: Escribir el resto (`03` y `04`).
