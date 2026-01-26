# Inyección de Dependencias y Lazy Loading

Explicación técnica de cómo el framework gestiona la memoria y los objetos.

## El Contenedor (`IContainer`)

Este objeto es la "sangre" del sistema. Fluye por todos lados.

```typescript
export interface IContainer {
    config: IConfig // Configuración global (cargada de .env)
    log: ILogger // Instancia del Logger
    db: IDatabase // Conexión activa a Postgres
    audit: IAuditService // Servicio de auditoría
    // ... otros servicios core
}
```

El `Dispatcher` crea este contenedor una vez (o lo reutiliza) y se lo pasa al `SecurityService`, que a su vez se lo pasa al `BusinessObject`.

**Beneficio**:
Si mañana quieres agregar un servicio de "Notificaciones Push" disponible para todos, solo lo agregas al Container en `Dispatcher` y automáticamente todos los BOs tienen acceso a `this.container.push`.

## Lazy Loading (Carga Perezosa)

Node.js es rápido, pero cargar 5000 archivos al inicio haría que el servidor tardara minutos en arrancar (pobre `npm run dev`).

Para evitar esto, implementamos Lazy Loading en el `TransactionExecutor`.

### Cómo funciona (`TransactionExecutor.ts`)

```typescript
// Pseudocódigo simplificado
async execute(objectName, method, params) {
    // 1. Construir ruta del archivo
    const path = `./BO/${objectName}/${objectName}BO.js`;

    // 2. Importar DINÁMICAMENTE (solo ahora se lee el disco)
    const module = await import(path);
    const BOClass = module[`${objectName}BO`];

    // 3. Instanciar e Inyectar
    const instance = new BOClass(this.container);

    // 4. Ejecutar
    return instance[method](params);
}
```

### Ventajas

1.  **Inicio Instantáneo**: El servidor arranca en milisegundos, sin importar si tienes 10 o 1000 BOs.
2.  **Aislamiento de Errores**: Si un BO tiene un error de sintaxis, no rompe el servidor hasta que alguien intenta usar ESE BO específico.
3.  **Menor Memoria**: Node.js puede liberar memoria de módulos poco usados (dependiendo del Garbage Collector).
