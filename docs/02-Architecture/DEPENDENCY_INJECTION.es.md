# Inyección de Dependencias y Lazy Loading

Explicación técnica de cómo el framework gestiona la memoria y las dependencias de los objetos de negocio.

## Gestión de Dependencias (`BOService`)

En versiones anteriores usábamos un contenedor global. Ahora, utilizamos **Inyección de Dependencias Explícita** a través de la clase base `BOService`.

```typescript
// src/core/business-objects/BOService.ts
export class BOService {
    constructor(
        protected readonly log: ILogger,
        protected readonly config: IConfig,
        protected readonly db: IDatabase
    ) {}
}
```

### Cómo fluye

1. **Dispatcher**: Crea instancias de `db`, `log` y `config`.
2. **Business Object (BO)**: Recibe estas dependencias en su constructor (`BODependencies`).
3. **Capa de Servicio**: El BO las pasa al `Service`, que extiende `BOService`.

**Beneficio**:

- **Seguridad de Tipos**: Sin contenedores "any" mágicos. Sabes exactamente de qué depende un Servicio.
- **Testabilidad**: Puedes mockear fácilmente `db` o `log` al hacer unit testing de un Servicio.
- **Claridad**: Las dependencias son explícitas en el constructor.

## Lazy Loading (Carga Perezosa)

Node.js es rápido, pero cargar miles de archivos al inicio haría que el servidor tardara en arrancar. Para evitar esto, implementamos Lazy Loading.

### Cómo funciona (`TransactionExecutor.ts`)

```typescript
// Concepto Simplificado
async execute(objectName, method, params) {
    // 1. Construir ruta del archivo dinámicamente
    const path = `../../BO/${objectName}/${objectName}BO.js`

    // 2. Importar DINÁMICAMENTE (solo se importa cuando se solicita)
    const module = await import(path)
    const BOClass = module[`${objectName}BO`]

    // 3. Instanciar e Inyectar Dependencias Core
    const instance = new BOClass({
        db: this.db,
        log: this.log,
        config: this.config,
        v: this.validator
    })

    // 4. Ejecutar
    return instance[method](params)
}
```

### Ventajas

1.  **Inicio Instantáneo**: El servidor arranca en milisegundos, sin importar el tamaño del código.
2.  **Aislamiento de Errores**: Un error de sintaxis en un BO específico no rompe todo el servidor hasta que ese BO es realmente invocado.
3.  **Eficiencia**: La memoria se asigna solo para contextos activos.
