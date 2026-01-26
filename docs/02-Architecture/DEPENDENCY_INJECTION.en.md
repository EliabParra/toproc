# Dependency Injection

This is a fancy term for something very simple: **Don't cook your own food, order room service.**

## What does it mean?

Instead of your code "creating" the things it needs, the system "delivers" them ready to use.

### Example Without Injection (Bad Idea)

```typescript
// Bad: The BO has to know how to connect to the DB
class ProductBO {
    constructor() {
        this.db = new PostgresConnection('localhost', 'password') // Hardcoded!
    }
}
```

### Example With Injection (Our Architecture)

```typescript
// Good: The BO receives the DB already ready
class ProductBO extends BaseBO {
    constructor(container: IContainer) {
        super(container) // Thanks for the DB!
    }
}
```

## The Container (`IContainer`)

Imagine a magic toolbox that is passed from hand to hand. That box contains:

- `db`: Data access.
- `logger`: For logging.
- `audit`: For auditing.
- `config`: System configuration.

When your BO wakes up, it receives this box. So your BO doesn't need to know _how_ the database connects, it just _uses_ it.

## Lazy Loading

The `Dispatcher` doesn't load all files at startup (that would be slow). It only loads the BO needed at that moment.

1. Request arrives for `tx: 101`.
2. Dispatcher looks up `tx: 101` -> `AuthBO`.
3. `import(AuthBO)`.
4. `new AuthBO(container)`.
5. Execute.
6. Garbage Collection.

This makes the system very lightweight and fast.
