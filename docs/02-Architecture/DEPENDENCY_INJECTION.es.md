# Inyección de Dependencias (Dependency Injection)

Este es un término elegante para algo muy simple: **No cocinar tu propia comida, pedir servicio a la habitación.**

## ¿Qué significa?

En lugar de que tu código "cree" las cosas que necesita, el sistema se las "entrega" listas para usar.

### Ejemplo Sin Inyección (Mala Idea)

```typescript
// Malo: El BO tiene que saber cómo conectarse a la DB
class ProductBO {
    constructor() {
        this.db = new PostgresConnection('localhost', 'password') // ¡Hardcoded!
    }
}
```

### Ejemplo Con Inyección (Nuestra Arquitectura)

```typescript
// Bueno: El BO recibe la DB ya lista
class ProductBO extends BaseBO {
    constructor(container: IContainer) {
        super(container) // ¡Gracias por la DB!
    }
}
```

## El Contendor (`IContainer`)

Imagina una caja de herramientas mágica que se pasa de mano en mano. Esa caja contiene:

- `db`: Acceso a datos.
- `logger`: Para escribir logs.
- `audit`: Para auditoría.
- `config`: La configuración del sistema.

Cuando tu BO se despierta, recibe esta caja. Así tu BO no necesita saber _cómo_ se conecta la base de datos, solo la _usa_.

## Carga Dinámica (Lazy Loading)

El `Dispatcher` no carga todos los archivos al inicio (sería muy lento). Solo carga el BO que hace falta en ese momento.

1. Llega petición para `tx: 101`.
2. Dispatcher busca `tx: 101` -> `AuthBO`.
3. `import(AuthBO)`.
4. `new AuthBO(container)`.
5. Ejecutar.
6. Tirar a la basura (Garbage Collection).

Esto hace que el sistema sea muy ligero y rápido.
