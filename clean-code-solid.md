# **Clean Code - Principios Fundamentales para TypeScript**

## **1. Introducción a Clean Code**
Clean Code (Código Limpio) es una filosofía de desarrollo que prioriza **legibilidad, mantenibilidad y simplicidad**. No se trata solo de que el código funcione, sino de que sea **comprensible por humanos** meses después de ser escrito.

### **Filosofía Central:**
> "El código se escribe una vez, pero se lee decenas de veces. Escribe para el lector, no para la máquina."

## **2. Principios Clave del Clean Code**

### **2.1. Nombres Significativos**
**Regla:** Los nombres deben revelar intención, no requerir comentarios explicativos.

```typescript
// ❌ MAL - Nombres vagos, no dicen nada
const d: number; // ¿d de qué?
function proc(): void; // ¿procesa qué?
const lst: any[]; // ¿lista de qué?

// ✅ BIEN - Nombres explícitos
const daysSinceLastLogin: number;
function processUserSubscription(): void;
const activeUsers: User[];
```

**Preguntas para evaluar nombres:**
- ¿El nombre revela el "qué" y el "por qué"?
- ¿Un desarrollador nuevo entendería su propósito?
- ¿Hay ambigüedad o necesidad de adivinar?

### **2.2. Funciones Pequeñas y Enfocadas**
**Regla:** Una función debe hacer **una sola cosa** y hacerla bien.

```typescript
// ❌ MAL - Muchas responsabilidades
function handleUserData(data: any): void {
  // 1. Validar datos
  if (!data.name || data.name.length < 3) {
    throw new Error("Nombre inválido");
  }
  // 2. Transformar datos
  const processed = { ...data, name: data.name.trim() };
  // 3. Guardar en DB
  database.save(processed);
  // 4. Enviar email
  emailService.sendWelcome(processed.email);
  // 5. Loggear
  console.log("Usuario procesado:", processed.id);
}

// ✅ BIEN - Funciones pequeñas y enfocadas
function validateUserData(data: UserData): ValidationResult { /* ... */ }
function transformUserData(data: UserData): ProcessedUser { /* ... */ }
function saveUserToDatabase(user: ProcessedUser): void { /* ... */ }
function sendWelcomeEmail(email: string): void { /* ... */ }
function logUserCreation(userId: string): void { /* ... */ }

// Función principal que coordina
function handleUserData(data: UserData): void {
  validateUserData(data);
  const processed = transformUserData(data);
  saveUserToDatabase(processed);
  sendWelcomeEmail(processed.email);
  logUserCreation(processed.id);
}
```

**Métricas ideales:**
- **Líneas por función:** ≤ 20 líneas
- **Parámetros:** ≤ 3 parámetros
- **Nivel de indentación:** ≤ 2 niveles

### **2.3. Comentarios Útiles (No Redundantes)**
**Regla:** Los comentarios deben explicar el "por qué", no el "qué".

```typescript
// ❌ MAL - Comentarios redundantes
// Incrementar el contador
counter++;

// Función para sumar dos números
function add(a: number, b: number): number {
  return a + b;
}

// ✅ BIEN - Comentarios que agregan contexto
// Usar Math.floor en vez de bitwise OR para mejor legibilidad
// Referencia: https://github.com/microsoft/TypeScript/issues/12345
const randomIndex = Math.floor(Math.random() * array.length);

/**
 * Normaliza el precio considerando impuestos regionales.
 * @param basePrice - Precio base sin impuestos
 * @param region - Código de región para cálculos de IVA
 * @returns Precio final con impuestos aplicados
 * 
 * @remarks
 * Los impuestos varían por región:
 * - EU: 21% VAT
 * - US: varía por estado (promedio 8%)
 * - MX: 16% IVA
 */
function calculateFinalPrice(basePrice: number, region: RegionCode): number {
  const taxRate = getTaxRateForRegion(region);
  return basePrice * (1 + taxRate);
}
```

### **2.4. Código sin Duplicación (DRY - Don't Repeat Yourself)**
**Regla:** Cada conocimiento debe tener una representación única y autoritativa.

```typescript
// ❌ MAL - Lógica duplicada
function calculateCircleArea(radius: number): number {
  return 3.14159 * radius * radius;
}

function calculateCirclePerimeter(radius: number): number {
  return 2 * 3.14159 * radius;
}

function calculateSphereVolume(radius: number): number {
  return (4 / 3) * 3.14159 * radius * radius * radius;
}

// ✅ BIEN - Constantes y funciones reutilizables
const PI = 3.14159;

function calculateCircleArea(radius: number): number {
  return PI * radius * radius;
}

function calculateCirclePerimeter(radius: number): number {
  return 2 * PI * radius;
}

function calculateSphereVolume(radius: number): number {
  return (4 / 3) * PI * Math.pow(radius, 3);
}
```

### **2.5. Manejo Consistente de Errores**
**Regla:** Los errores son parte del contrato de la función.

```typescript
// ❌ MAL - Errores silenciosos o inconsistentes
function divide(a: number, b: number): number {
  if (b === 0) {
    return -1; // ¿Qué significa -1?
  }
  return a / b;
}

// ✅ BIEN - Errores explícitos y tipados
class DivisionByZeroError extends Error {
  constructor() {
    super("Cannot divide by zero");
    this.name = "DivisionByZeroError";
  }
}

function divide(a: number, b: number): number {
  if (b === 0) {
    throw new DivisionByZeroError();
  }
  return a / b;
}

// O usando Result pattern
type Result<T, E> = { success: true; value: T } | { success: false; error: E };

function divide(a: number, b: number): Result<number, string> {
  if (b === 0) {
    return { success: false, error: "Division by zero" };
  }
  return { success: true, value: a / b };
}
```

## **3. Patrones Específicos para TypeScript**

### **3.1. Tipado Estricto y Explícito**
```typescript
// ❌ MAL - Uso excesivo de `any`
function processData(data: any): any {
  // ¿Qué forma tiene data? ¿Qué retorna?
  return data.processed ? data.value : null;
}

// ✅ BIEN - Tipos explícitos e interfaces
interface ProcessingResult {
  success: boolean;
  value?: number;
  error?: string;
}

function processData(data: InputData): ProcessingResult {
  if (data.processed) {
    return { success: true, value: data.value };
  }
  return { success: false, error: "Data not processed" };
}
```

### **3.2. Uso Adecuado de `unknown` vs `any`**
```typescript
// ❌ MAL - `any` permite cualquier cosa
function unsafeParse(json: string): any {
  return JSON.parse(json);
}
const result = unsafeParse('{"id": 1}');
result.nonExistentProperty.boom(); // 💥 Runtime error

// ✅ BIEN - `unknown` requiere validación
function safeParse<T>(json: string): unknown {
  return JSON.parse(json);
}

const parsed = safeParse('{"id": 1}');
if (isValidData(parsed)) {
  // TypeScript sabe que `parsed` es ValidData aquí
  console.log(parsed.id);
}

// Con type guards
function isValidData(data: unknown): data is { id: number } {
  return typeof data === 'object' && data !== null && 'id' in data;
}
```

### **3.3. Enums vs Union Types**
```typescript
// ❌ MAL - Magic strings/numbers
const STATUS_ACTIVE = 1;
const STATUS_INACTIVE = 2;
const STATUS_PENDING = 3;

function setUserStatus(status: number): void {
  // ¿Qué números son válidos?
}

// ✅ BIEN - Union types para mejor autocompletado
type UserStatus = 'active' | 'inactive' | 'pending';

function setUserStatus(status: UserStatus): void {
  // TypeScript valida automáticamente
}

// O Enums para valores más complejos
enum UserStatusCode {
  Active = 'ACTIVE',
  Inactive = 'INACTIVE',
  Pending = 'PENDING_REVIEW'
}
```

## **4. Métricas de Calidad para Clean Code**

### **4.1. Métricas Cuantitativas**
- **Complejidad Ciclomática:** < 10 por función
- **Líneas de Código por Función:** < 20
- **Profundidad de Anidación:** < 3 niveles
- **Densidad de Comentarios:** 10-20%
- **Tasa de Duplicación:** < 3%

### **4.2. Métricas Cualitativas**
- **Legibilidad:** ¿Puede un desarrollador junior entenderlo en 5 minutos?
- **Mantenibilidad:** ¿Es fácil hacer cambios sin romper otras cosas?
- **Testabilidad:** ¿Se pueden escribir tests unitarios fácilmente?
- **Consistencia:** ¿Sigue los mismos patrones que el resto del código?

## **5. Preguntas para Evaluar Clean Code**

### **Al Revisar una Función:**
1. ¿El nombre revela exactamente qué hace?
2. ¿Hace más de una cosa?
3. ¿Tiene más de 3 parámetros?
4. ¿Tiene efectos secundarios no obvios?
5. ¿Puede reducirse a funciones más pequeñas?

### **Al Revisar una Clase:**
1. ¿Tiene una responsabilidad clara y única?
2. ¿Los nombres de métodos son verbos activos?
3. ¿El estado interno está encapsulado?
4. ¿Las dependencias son explícitas?
5. ¿Es fácil de testear en aislamiento?

### **Al Revisar un Módulo:**
1. ¿Tiene una interfaz clara y minimalista?
2. ¿Está débilmente acoplado con otros módulos?
3. ¿Expone solo lo necesario?
4. ¿Los imports/exports son organizados?
5. ¿Sigue la convención del proyecto?

## **6. Checklist para Refactorización**

### **Antes de Refactorizar:**
- [ ] Tests existentes cubren la funcionalidad
- [ ] Entiendes qué hace el código (no solo cómo)
- [ ] Tienes un plan claro de cambios
- [ ] Sabes cómo medir el éxito

### **Durante la Refactorización:**
- [ ] Cambios pequeños e incrementales
- [ ] Tests pasan después de cada cambio
- [ ] No cambias comportamiento (solo estructura)
- [ ] Documentas decisiones importantes

### **Después de Refactorizar:**
- [ ] Todos los tests pasan
- [ ] La cobertura no disminuye
- [ ] El rendimiento no empeora
- [ ] La documentación está actualizada

## **7. Patrones Comunes de Mejora**

### **Extraer Método:**
```typescript
// ANTES
function processOrder(order: Order): void {
  // Validación
  if (!order.items || order.items.length === 0) {
    throw new Error("Order must have items");
  }
  // Cálculo de total
  let total = 0;
  for (const item of order.items) {
    total += item.price * item.quantity;
  }
  // Más lógica...
}

// DESPUÉS
function processOrder(order: Order): void {
  validateOrder(order);
  const total = calculateOrderTotal(order);
  // Más lógica...
}

function validateOrder(order: Order): void {
  if (!order.items || order.items.length === 0) {
    throw new Error("Order must have items");
  }
}

function calculateOrderTotal(order: Order): number {
  return order.items.reduce((total, item) => total + item.price * item.quantity, 0);
}
```

### **Reemplazar Condicional con Polimorfismo:**
```typescript
// ANTES
function calculateShipping(vehicleType: string, distance: number): number {
  if (vehicleType === 'truck') {
    return distance * 2.5;
  } else if (vehicleType === 'car') {
    return distance * 1.8;
  } else if (vehicleType === 'bike') {
    return distance * 0.5;
  }
  throw new Error("Unknown vehicle type");
}

// DESPUÉS
interface Vehicle {
  calculateShipping(distance: number): number;
}

class Truck implements Vehicle {
  calculateShipping(distance: number): number {
    return distance * 2.5;
  }
}

class Car implements Vehicle {
  calculateShipping(distance: number): number {
    return distance * 1.8;
  }
}

class Bike implements Vehicle {
  calculateShipping(distance: number): number {
    return distance * 0.5;
  }
}
```

## **8. Recursos para Profundizar**

### **Libros Esenciales:**
- "Clean Code" de Robert C. Martin
- "Refactoring" de Martin Fowler
- "The Pragmatic Programmer" de Andrew Hunt y David Thomas

### **Herramientas para TypeScript:**
- ESLint con reglas de Clean Code
- SonarQube para análisis estático
- CodeClimate para métricas de calidad
- TypeScript Compiler con `strict: true`

### **Principios Relacionados:**
- **KISS:** Keep It Simple, Stupid
- **YAGNI:** You Ain't Gonna Need It
- **DRY:** Don't Repeat Yourself
- **SOC:** Separation of Concerns

---

**Regla Final:** El código limpio no es un destino, es un viaje continuo. Refactoriza constantemente, mejora incrementalmente y siempre escribe código como si la persona que lo mantendrá fuera un psicópata que sabe dónde vives.

---

# **SOLID - Principios de Diseño para TypeScript**

## **1. Introducción a SOLID**
SOLID es un acrónimo que representa cinco principios de diseño orientado a objetos que hacen que el software sea más **comprensible, flexible y mantenible**. Son especialmente importantes en proyectos TypeScript de larga duración.

### **Filosofía Central:**
> "Diseña módulos que sean fáciles de extender y difíciles de modificar."

## **2. Los Cinco Principios SOLID**

### **S - Single Responsibility Principle (SRP)**
**Principio de Responsabilidad Única**

> "Una clase debe tener una, y solo una, razón para cambiar."

#### **Explicación:**
Cada clase debe tener una responsabilidad única y bien definida. Si una clase maneja múltiples responsabilidades, los cambios en una afectarán a las otras.

#### **Ejemplo TypeScript:**
```typescript
// ❌ VIOLA SRP - Muchas responsabilidades
class UserManager {
  // Responsabilidad 1: Gestión de usuarios
  createUser(userData: UserData): User {
    // Lógica de creación
  }
  
  updateUser(userId: string, updates: Partial<User>): User {
    // Lógica de actualización
  }
  
  // Responsabilidad 2: Validación
  validateEmail(email: string): boolean {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }
  
  validatePassword(password: string): boolean {
    return password.length >= 8;
  }
  
  // Responsabilidad 3: Persistencia
  saveToDatabase(user: User): void {
    databaseConnection.save(user);
  }
  
  // Responsabilidad 4: Logging
  logActivity(userId: string, activity: string): void {
    console.log(`User ${userId}: ${activity}`);
  }
}

// ✅ CUMPLE SRP - Responsabilidades separadas
class UserRepository {
  create(userData: UserData): User { /* ... */ }
  update(userId: string, updates: Partial<User>): User { /* ... */ }
  save(user: User): void { /* ... */ }
}

class UserValidator {
  validateEmail(email: string): boolean { /* ... */ }
  validatePassword(password: string): boolean { /* ... */ }
  validateUser(userData: UserData): ValidationResult { /* ... */ }
}

class ActivityLogger {
  log(userId: string, activity: string): void { /* ... */ }
}

// Clase coordinadora
class UserService {
  constructor(
    private repository: UserRepository,
    private validator: UserValidator,
    private logger: ActivityLogger
  ) {}
  
  createUser(userData: UserData): User {
    this.validator.validateUser(userData);
    const user = this.repository.create(userData);
    this.repository.save(user);
    this.logger.log(user.id, "User created");
    return user;
  }
}
```

#### **Preguntas para evaluar SRP:**
1. ¿Puedes describir la responsabilidad de la clase en una oración simple?
2. ¿Cambios en requisitos de negocio afectarían solo una parte de la clase?
3. ¿Puedes extraer alguna responsabilidad a otra clase sin esfuerzo?

### **O - Open/Closed Principle (OCP)**
**Principio de Abierto/Cerrado**

> "Las entidades de software deben estar abiertas para extensión, pero cerradas para modificación."

#### **Explicación:**
Debes poder agregar nuevas funcionalidades sin modificar el código existente. Se logra mediante abstracciones (interfaces, clases abstractas).

#### **Ejemplo TypeScript:**
```typescript
// ❌ VIOLA OCP - Modificar para agregar nuevas formas
class AreaCalculator {
  calculateArea(shape: any): number {
    if (shape.type === 'circle') {
      return Math.PI * shape.radius * shape.radius;
    } else if (shape.type === 'rectangle') {
      return shape.width * shape.height;
    }
    // Agregar nuevo tipo requiere modificar esta función
    throw new Error("Shape not supported");
  }
}

// ✅ CUMPLE OCP - Extensible sin modificar
interface Shape {
  area(): number;
}

class Circle implements Shape {
  constructor(private radius: number) {}
  
  area(): number {
    return Math.PI * this.radius * this.radius;
  }
}

class Rectangle implements Shape {
  constructor(private width: number, private height: number) {}
  
  area(): number {
    return this.width * this.height;
  }
}

class Triangle implements Shape {
  constructor(private base: number, private height: number) {}
  
  area(): number {
    return (this.base * this.height) / 2;
  }
  // Nueva forma sin modificar AreaCalculator
}

class AreaCalculator {
  calculateArea(shape: Shape): number {
    return shape.area(); // No necesita saber el tipo concreto
  }
}
```

#### **Patrones que ayudan con OCP:**
- **Strategy Pattern:** Para algoritmos intercambiables
- **Observer Pattern:** Para notificaciones extensibles
- **Decorator Pattern:** Para agregar funcionalidad dinámicamente

### **L - Liskov Substitution Principle (LSP)**
**Principio de Sustitución de Liskov**

> "Los objetos de un programa deben ser reemplazables por instancias de sus subtipos sin alterar el correcto funcionamiento del programa."

#### **Explicación:**
Las clases derivadas deben poder sustituir a sus clases base sin que los consumidores se den cuenta. No deben romper las expectativas del contrato.

#### **Ejemplo TypeScript:**
```typescript
// ❌ VIOLA LSP - El cuadrado no se comporta como rectángulo
class Rectangle {
  constructor(protected width: number, protected height: number) {}
  
  setWidth(width: number): void {
    this.width = width;
  }
  
  setHeight(height: number): void {
    this.height = height;
  }
  
  area(): number {
    return this.width * this.height;
  }
}

class Square extends Rectangle {
  constructor(side: number) {
    super(side, side);
  }
  
  setWidth(width: number): void {
    super.setWidth(width);
    super.setHeight(width); // Rompe el comportamiento esperado
  }
  
  setHeight(height: number): void {
    super.setWidth(height); // Rompe el comportamiento esperado
    super.setHeight(height);
  }
}

// Test que falla por violación LSP
function testRectangleArea(rectangle: Rectangle): void {
  rectangle.setWidth(5);
  rectangle.setHeight(4);
  console.assert(rectangle.area() === 20); // Falla con Square
}

// ✅ CUMPLE LSP - Jerarquía correcta
interface Shape {
  area(): number;
}

class Rectangle implements Shape {
  constructor(private width: number, private height: number) {}
  
  area(): number {
    return this.width * this.height;
  }
}

class Square implements Shape {
  constructor(private side: number) {}
  
  area(): number {
    return this.side * this.side;
  }
}

// O usando composición en vez de herencia
class Square2 {
  constructor(private rectangle: Rectangle) {}
  
  setSide(side: number): void {
    this.rectangle = new Rectangle(side, side);
  }
  
  area(): number {
    return this.rectangle.area();
  }
}
```

#### **Reglas para LSP:**
1. **Precondiciones no deben fortalecerse:** Las subclases no pueden requerir más que la superclase
2. **Postcondiciones no deben debilitarse:** Las subclases no pueden prometer menos
3. **Invariantes deben preservarse:** Las propiedades que siempre son verdaderas en la superclase deben seguir siéndolo
4. **Historia no debe restringirse:** Las subclases no pueden modificar estado de formas prohibidas por la superclase

### **I - Interface Segregation Principle (ISP)**
**Principio de Segregación de Interfaces**

> "Muchas interfaces específicas del cliente son mejores que una interfaz de propósito general."

#### **Explicación:**
No obligues a los clientes a depender de interfaces que no usan. Divide interfaces grandes en interfaces más pequeñas y específicas.

#### **Ejemplo TypeScript:**
```typescript
// ❌ VIOLA ISP - Interfaz monolítica
interface Worker {
  work(): void;
  eat(): void;
  sleep(): void;
  code(): void;
  design(): void;
  test(): void;
}

class Developer implements Worker {
  work(): void { /* ... */ }
  eat(): void { /* ... */ }
  sleep(): void { /* ... */ }
  code(): void { /* ... */ }
  design(): void { /* NO SÉ DISEÑAR */ }
  test(): void { /* ODIO TESTEAR */ }
}

class Designer implements Worker {
  work(): void { /* ... */ }
  eat(): void { /* ... */ }
  sleep(): void { /* ... */ }
  code(): void { /* NO SÉ PROGRAMAR */ }
  design(): void { /* ... */ }
  test(): void { /* NO SÉ TESTEAR */ }
}

// ✅ CUMPLE ISP - Interfaces segregadas
interface Employee {
  work(): void;
  eat(): void;
  sleep(): void;
}

interface Coder {
  code(): void;
  reviewCode(): void;
}

interface Designer {
  design(): void;
  createPrototype(): void;
}

interface Tester {
  test(): void;
  writeTestCases(): void;
}

class FullStackDeveloper implements Employee, Coder, Tester {
  work(): void { /* ... */ }
  eat(): void { /* ... */ }
  sleep(): void { /* ... */ }
  code(): void { /* ... */ }
  reviewCode(): void { /* ... */ }
  test(): void { /* ... */ }
  writeTestCases(): void { /* ... */ }
  // No implementa Designer - no necesita saber diseñar
}

class UXDesigner implements Employee, Designer {
  work(): void { /* ... */ }
  eat(): void { /* ... */ }
  sleep(): void { /* ... */ }
  design(): void { /* ... */ }
  createPrototype(): void { /* ... */ }
  // No implementa Coder ni Tester
}
```

#### **Beneficios de ISP:**
1. **Menos dependencias:** Los clientes solo dependen de lo que usan
2. **Mejor cohesión:** Interfaces más enfocadas
3. **Menos cambios:** Cambios en una interfaz afectan menos clientes
4. **Mejor testing:** Mockear interfaces más pequeñas es más fácil

### **D - Dependency Inversion Principle (DIP)**
**Principio de Inversión de Dependencias**

> "Depende de abstracciones, no de concreciones."

#### **Explicación:**
Los módulos de alto nivel no deben depender de módulos de bajo nivel. Ambos deben depender de abstracciones. Las abstracciones no deben depender de detalles, los detalles deben depender de abstracciones.

#### **Ejemplo TypeScript:**
```typescript
// ❌ VIOLA DIP - Dependencia directa de implementación
class UserService {
  private userRepository: MySQLUserRepository;
  
  constructor() {
    this.userRepository = new MySQLUserRepository(); // Acoplamiento fuerte
  }
  
  getUser(id: string): User {
    return this.userRepository.findById(id);
  }
}

class MySQLUserRepository {
  findById(id: string): User {
    // Conexión directa a MySQL
    return mysql.query("SELECT * FROM users WHERE id = ?", [id]);
  }
}

// ✅ CUMPLE DIP - Dependencia de abstracción
interface UserRepository {
  findById(id: string): Promise<User>;
  save(user: User): Promise<void>;
}

class UserService {
  constructor(private userRepository: UserRepository) {} // Inyección de dependencia
  
  async getUser(id: string): Promise<User> {
    return await this.userRepository.findById(id);
  }
}

// Implementaciones concretas
class MySQLUserRepository implements UserRepository {
  async findById(id: string): Promise<User> {
    // Implementación MySQL
  }
  
  async save(user: User): Promise<void> {
    // Implementación MySQL
  }
}

class PostgreSQLUserRepository implements UserRepository {
  async findById(id: string): Promise<User> {
    // Implementación PostgreSQL
  }
  
  async save(user: User): Promise<void> {
    // Implementación PostgreSQL
  }
}

class InMemoryUserRepository implements UserRepository {
  private users = new Map<string, User>();
  
  async findById(id: string): Promise<User> {
    const user = this.users.get(id);
    if (!user) throw new Error("User not found");
    return user;
  }
  
  async save(user: User): Promise<void> {
    this.users.set(user.id, user);
  }
}

// Configuración en tiempo de ejecución
const repository = process.env.NODE_ENV === 'test' 
  ? new InMemoryUserRepository()
  : new PostgreSQLUserRepository();

const userService = new UserService(repository);
```

#### **Técnicas para aplicar DIP:**
1. **Inyección de Dependencias:** Pasar dependencias como parámetros
2. **Inversión de Control:** Framework decide qué implementación usar
3. **Service Locator Pattern:** Centralizar creación de dependencias
4. **Factory Pattern:** Encapsular creación de objetos

## **3. SOLID en Arquitecturas TypeScript Modernas**

### **3.1. Con Inyección de Dependencias**
```typescript
// Configuración con contenedor DI
import { Container } from 'inversify';

const container = new Container();

// Registro de abstracciones
container.bind<UserRepository>('UserRepository').to(PostgreSQLUserRepository);
container.bind<EmailService>('EmailService').to(SendGridEmailService);
container.bind<Logger>('Logger').to(ConsoleLogger);

// Clases que dependen de abstracciones
@injectable()
class RegistrationService {
  constructor(
    @inject('UserRepository') private userRepository: UserRepository,
    @inject('EmailService') private emailService: EmailService,
    @inject('Logger') private logger: Logger
  ) {}
  
  async register(userData: UserData): Promise<User> {
    const user = await this.userRepository.create(userData);
    await this.emailService.sendWelcomeEmail(user.email);
    this.logger.info(`User registered: ${user.id}`);
    return user;
  }
}
```

### **3.2. Con Programación Funcional + SOLID**
```typescript
// SOLID con funciones puras
type UserValidationRule = (user: UserData) => ValidationResult;

// SRP: Cada regla una responsabilidad
const validateEmail: UserValidationRule = (user) => {
  const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email);
  return isValid 
    ? { valid: true }
    : { valid: false, error: "Invalid email" };
};

const validateAge: UserValidationRule = (user) => {
  return user.age >= 18
    ? { valid: true }
    : { valid: false, error: "Must be 18 or older" };
};

// OCP: Fácil agregar nuevas reglas
const validatePasswordStrength: UserValidationRule = (user) => {
  const hasMinLength = user.password.length >= 8;
  const hasUppercase = /[A-Z]/.test(user.password);
  const hasNumber = /[0-9]/.test(user.password);
  
  return hasMinLength && hasUppercase && hasNumber
    ? { valid: true }
    : { valid: false, error: "Password too weak" };
};

// LSP: Las reglas son intercambiables
const validateUser = (user: UserData, rules: UserValidationRule[]): ValidationResult[] => {
  return rules.map(rule => rule(user));
};

// ISP: Usar solo las reglas necesarias
const basicValidationRules = [validateEmail, validateAge];
const strongValidationRules = [...basicValidationRules, validatePasswordStrength];

// DIP: Las reglas dependen de la abstracción UserValidationRule
const createUserValidator = (rules: UserValidationRule[]) => {
  return (user: UserData): ValidationResult[] => validateUser(user, rules);
};
```

## **4. Métricas y Evaluación de SOLID**

### **4.1. Métricas Cuantitativas**
- **Acoplamiento Aferente:** Número de clases que dependen de esta clase (bajo es mejor)
- **Acoplamiento Eferente:** Número de clases de las que esta clase depende (moderado)
- **Inestabilidad:** Eferente / (Aferente + Eferente) (0-1, 1 es muy inestable)
- **Responsabilidades por Clase:** Idealmente 1 (SRP)

### **4.2. Señales de Violaciones**
#### **SRP Violado:**
- La clase tiene más de 200 líneas
- Tiene métodos que no están relacionados lógicamente
- Cambios frecuentes por razones diferentes

#### **OCP Violado:**
- Switch/case o if/else largos basados en tipos
- Modificas código existente para agregar nuevas funcionalidades
- Muchos importes de clases concretas

#### **LSP Violado:**
- Instanceof checks en el código
- Subclases que lanzan "NotImplementedError"
- Tests que fallan cuando usas subclases

#### **ISP Violado:**
- Interfaces con muchos métodos (> 10)
- Clases que implementan métodos vacíos o que lanzan excepciones
- Clients que solo usan un subconjunto de la interfaz

#### **DIP Violado:**
- `new` Keyword en medio de la lógica de negocio
- Dependencias de módulos de infraestructura en dominio
- Dificultad para hacer testing unitario

## **5. Preguntas para Evaluar SOLID**

### **Para Cada Clase/Interface:**
1. **SRP:** ¿Puedo describir su propósito en una oración simple sin "y"?
2. **OCP:** ¿Puedo agregar nuevas funcionalidades sin modificar esta clase?
3. **LSP:** ¿Puedo reemplazarla con cualquier subclase sin romper nada?
4. **ISP:** ¿Los clientes usan todos los métodos que implementan?
5. **DIP:** ¿Depende de abstracciones en vez de implementaciones concretas?

### **Para el Diseño del Sistema:**
1. ¿El acoplamiento entre módulos es bajo?
2. ¿La cohesión dentro de los módulos es alta?
3. ¿Es fácil reemplazar implementaciones?
4. ¿El testing es sencillo?
5. ¿La extensión es más común que la modificación?

## **6. Patrones que Facilitan SOLID**

### **Para SRP:**
- **Command Pattern:** Encapsula cada operación
- **Repository Pattern:** Separa persistencia de lógica de negocio
- **Service Layer:** Separa orquestación de lógica

### **Para OCP:**
- **Strategy Pattern:** Intercambia algoritmos
- **Template Method:** Define esqueleto, permite variaciones
- **Plugin Architecture:** Extiende mediante plugins

### **Para LSP:**
- **Composition over Inheritance:** Usa composición en vez de herencia
- **Interface Segregation:** Interfaces pequeñas y específicas
- **Design by Contract:** Precondiciones/postcondiciones explícitas

### **Para ISP:**
- **Role Interfaces:** Interfaces por rol, no por clase
- **Adapter Pattern:** Adapta interfaces grandes a necesidades específicas
- **Facade Pattern:** Proporciona interfaz simplificada

### **Para DIP:**
- **Dependency Injection:** Inyecta dependencias
- **Abstract Factory:** Crea familias de objetos
- **Service Locator:** Localiza servicios (con cuidado)

## **7. Herramientas para TypeScript**

### **Análisis Estático:**
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

### **Linting con ESLint:**
```json
{
  "rules": {
    "@typescript-eslint/explicit-function-return-type": "error",
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/no-explicit-any": "warn",
    "max-lines-per-function": ["warn", 50],
    "max-depth": ["warn", 3]
  }
}
```

### **Testing:**
```typescript
// Tests que verifican principios SOLID
describe('SOLID Principles', () => {
  test('SRP: UserService should not know about database', () => {
    const mockRepository = { save: jest.fn() };
    const service = new UserService(mockRepository);
    // Test que el servicio no accede directamente a DB
  });
  
  test('LSP: All Shape implementations should calculate area', () => {
    const shapes: Shape[] = [new Circle(5), new Rectangle(3, 4)];
    shapes.forEach(shape => {
      expect(typeof shape.area()).toBe('number');
    });
  });
});
```

## **8. Ejemplo Completo: Sistema de Pagos SOLID**

```typescript
// Abstracciones (DIP)
interface PaymentProcessor {
  process(amount: number): Promise<PaymentResult>;
}

interface PaymentValidator {
  validate(amount: number, currency: string): ValidationResult;
}

interface PaymentLogger {
  log(payment: Payment): void;
}

// Implementaciones concretas
class CreditCardProcessor implements PaymentProcessor {
  constructor(
    private validator: PaymentValidator,
    private logger: PaymentLogger
  ) {}
  
  async process(amount: number): Promise<PaymentResult> {
    // SRP: Solo procesa tarjetas
    const validation = this.validator.validate(amount, 'USD');
    if (!validation.valid) {
      throw new Error(validation.error);
    }
    
    // Lógica específica de tarjeta
    const result = await this.chargeCreditCard(amount);
    
    this.logger.log({
      amount,
      method: 'credit_card',
      success: result.success
    });
    
    return result;
  }
  
  private async chargeCreditCard(amount: number): Promise<PaymentResult> {
    // Implementación real
  }
}

class PayPalProcessor implements PaymentProcessor {
  // OCP: Nueva implementación sin modificar existentes
  async process(amount: number): Promise<PaymentResult> {
    // Implementación PayPal
  }
}

// Uso con DI
class PaymentService {
  constructor(
    private processors: Map<string, PaymentProcessor>,
    private validator: PaymentValidator
  ) {}
  
  async processPayment(
    method: string,
    amount: number
  ): Promise<PaymentResult> {
    const processor = this.processors.get(method);
    if (!processor) {
      throw new Error(`Unsupported payment method: ${method}`);
    }
    
    return await processor.process(amount);
  }
}

// Configuración
const processors = new Map<string, PaymentProcessor>();
processors.set('credit_card', new CreditCardProcessor(validator, logger));
processors.set('paypal', new PayPalProcessor());
// ISP: PayPal no necesita validator ni logger si no los usa

const paymentService = new PaymentService(processors, validator);
```

## **9. Consejos para Aplicar SOLID en TypeScript**

### **Incrementalmente:**
1. Empieza con **SRP** - es el más fácil y da más beneficio inmediato
2. Luego **DIP** - facilita testing y desacoplamiento
3. Después **ISP** - mejora mantenibilidad de interfaces
4. **OCP** y **LSP** requieren más diseño anticipado

### **Cuándo Romper las Reglas:**
1. **Prototipos/Rápidos:** SOLID puede ralentizar desarrollo inicial
2. **Clases de Configuración:** A veces está bien tener clases "omnipotentes"
3. **Utilities:** Clases estáticas con métodos helpers
4. **DTOs/VO:** Estructuras de datos simples

### **Balance:**
> "SOLID es una guía, no una religión. Usa criterio y considera el contexto."

## **10. Recursos para Aprender Más**

### **Libros:**
- "Clean Architecture" de Robert C. Martin
- "Agile Software Development: Principles, Patterns, and Practices" de Robert C. Martin
- "Design Patterns: Elements of Reusable Object-Oriented Software" (Gang of Four)

### **Artículos:**
- "The SOLID Principles in Pictures" de William Durand
- "TypeScript and SOLID Principles" serie en Medium
- "Applying SOLID to Functional Programming"

### **Herramientas:**
- **TS-Morph:** Para análisis y refactorización automática
- **TypeDoc:** Para documentación de tipos e interfaces
- **NestJS:** Framework que promueve SOLID por diseño

---

**Conclusión:** SOLID no es acerca de escribir código "perfecto", sino de escribir código que sea **fácil de cambiar**. En un proyecto TypeScript, estos principios te ayudan a crear un sistema que puede evolucionar con el tiempo sin convertirse en un "big ball of mud".

**Recuerda:** La mejor arquitectura es la que permite cambiar de opinión. SOLID te da esa flexibilidad.