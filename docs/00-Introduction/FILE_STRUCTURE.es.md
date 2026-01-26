# Estructura de Archivos (File Structure)

Aquí explicamos qué hay en cada carpeta para que no te pierdas.

```text
/
├── BO/                      # [Business Objects] Aquí vive TU código de negocio.
│   ├── Auth/                # Módulo de ejemplo (Autenticación)
│   └── ...                  # Aquí crearás tus nuevos módulos.
│
├── docs/                    # [Documentación] Donde estás leyendo esto.
│
├── src/                     # [Source] El corazón del framework.
│   ├── api/                 # Entrada HTTP (Express) y Dispatcher.
│   ├── config/              # Carga de variables de entorno (.env).
│   ├── core/                # Piezas fundamentales (no tocar a menos que sepas qué haces).
│   │   ├── base/            # Clases base (BaseBO).
│   │   ├── security/        # Servicio de seguridad.
│   │   └── transaction/     # Ejecutor de transacciones.
│   │
│   ├── db/                  # Conexión a Base de Datos.
│   ├── express/             # Configuración del servidor web.
│   ├── infra/               # Servicios externos (Audit, Email).
│   ├── logger/              # Sistema de logs.
│   ├── session/             # Manejo de usuarios conectados.
│   └── types/               # Definiciones de TypeScript.
│
├── test/                    # Tests unitarios e integración.
├── .env.example             # Plantilla de configuración.
└── package.json             # Dependencias del proyecto.
```

## Reglas de Oro

1.  **El código de negocio va en `BO/`**: Si estás creando una funcionalidad para vender productos, creas `BO/Products`. No tocas `src/core`.
2.  **`src/` es infraestructura**: `src` contiene el "motor" del coche. `BO` contiene el "destino" del viaje. Solo modifica `src` si estás mejorando el motor.
