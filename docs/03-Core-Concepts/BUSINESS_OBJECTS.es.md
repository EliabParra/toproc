# Business Objects (BOs)

Un **Business Object** (BO) es un módulo independiente que agrupa todo lo necesario para una funcionalidad de negocio (e.g., `Usuarios`, `Productos`, `Ventas`).

## Anatomía de un BO

Para mantener el orden, dividimos el BO en 3 capas internas:

```mermaid
graph TD
    API[Dispatcher] --> Controller[BO (Controlador)]
    Controller --> Service[Service (Lógica)]
    Service --> Repo[Repository (Datos)]
    Repo --> DB[(Database)]

    classDef bo fill:#f9f,stroke:#333;
    class Controller,Service,Repo bo;
```

### 1. El Controlador (`XBO.ts`)

Es la "cara pública" del módulo.

- **Responsabilidad**: Recibir datos, validar (`validate`), llamar al servicio y responder (`ok`/`error`).
- **Nunca**: Hace queries SQL directas o lógica compleja.
- **Analogía**: El mesero del restaurante. Toma tu orden, verifica que pidas algo que existe, y se la pasa a la cocina.

### 2. El Servicio (`XService.ts`)

Es el "cerebro" o la "cocina".

- **Responsabilidad**: Reglas de negocio. Calcular precios, verificar stock, enviar emails.
- **Nunca**: Habla HTTP (req/res) ni escribe SQL directo.
- **Analogía**: El chef. Sabe cómo cocinar el plato, pero no le importa quién lo pidió.

### 3. El Repositorio (`XRepository.ts`)

Es el "almacén".

- **Responsabilidad**: Hablar con la base de datos (SQL). `SELECT`, `INSERT`, `UPDATE`.
- **Nunca**: Toma decisiones de negocio. Solo guarda y trae datos.
- **Analogía**: El encargado de la despensa. Dame 3 huevos y 1kg de harina.

## Ejemplo de Código

```typescript
// UserController (BO)
async createUser(data) {
    if (!this.valid(data)) return this.error('Datos inválidos');
    return this.service.create(data);
}

// UserService
async create(user) {
    if (user.age < 18) throw new Error('Muy joven');
    return this.repo.save(user);
}

// UserRepository
async save(user) {
    return this.db.query('INSERT INTO users...', [user.name]);
}
```
