# Introducción y Filosofía (Introduction & Philosophy)

Bienvenido a la documentación definitiva de **ToProccess**.

> **Nota para el lector**: Esta documentación está diseñada para ser leída por cualquier persona, desde un desarrollador junior hasta un arquitecto de software. Si algún concepto te parece muy básico, puedes saltarlo. Si te parece muy complejo, hemos incluido analogías y diagramas para facilitarlo.

👀 **¿Buscas empezar ya?**

- **[Guía de Inicio Rápido (Docker vs Manual)](../01-Getting-Started/QUICK_START.es.md)** 🚀
- **[Flujo de Trabajo Colaborativo (Git, Frontend, Backend)](../05-Guides/COLLABORATIVE_WORKFLOW.es.md)** 🤝

## 1. La Visión del Proyecto

ToProccess no es solo "otro backend en Node.js". Es una respuesta a los problemas comunes que surgen cuando los proyectos crecen: código espagueti, lógica de negocio mezclada con base de datos, y seguridad inconsistente.

### ¿Qué problema resuelve?

En frameworks tradicionales como Express plano, es fácil empezar, pero muy fácil desordenarse.

- ¿Dónde pongo la validación?
- ¿Cómo aseguro que solo el admin vea esto?
- ¿Cómo reutilizo esta función sin copiar y pegar?

ToProccess resuelve esto imponiendo **Orden y Estándares**.

### Filosofía de Diseño: "Rails" sobre Express

Inspirado en la filosofía de "Convención sobre Configuración".

- **Estructura Rígida**: Hay un lugar específico para cada cosa (`BO`, `Service`, `Repository`).
- **Seguridad Paranoica**: Todo está prohibido por defecto ("Deny by Default").
- **Tipado Fuerte**: Usamos TypeScript estricto. Si compila, probablemente funciona.

---

## 2. Pilares de la Arquitectura

### A. Clean Architecture Simplificada

Separamos el código en capas concéntricas.

1.  **Dominio (Centro)**: Tus reglas de negocio (`BO` y `Service`). No saben que existen bases de datos ni HTTP. Son puros.
2.  **Infraestructura (Borde)**: Base de datos, sistema de archivos, email. Son herramientas que el Dominio usa.
3.  **Interfaz (Exterior)**: API HTTP. Solo recibe peticiones y las transforma.

**Beneficio**: Puedes cambiar PostgreSQL por MongoDB, o Express por Fastify, y tu lógica de negocio (lo más valioso) no cambia ni una línea.

### B. Inyección de Dependencias (Dependency Injection)

En lugar de que tus objetos creen sus propias dependencias, el sistema se las da.

- **Antes**: `const db = require('db');` (Difícil de probar, acoplado).
- **Ahora**: `constructor(container) { this.db = container.db; }` (Fácil de probar, modular).

Esto nos permite hacer **Mocking** en los tests: podemos pasar una "base de datos falsa" al BO para probarlo sin tocar la base de datos real.

### C. Programación Orientada a Transacciones (RPC-Style)

A diferencia de REST puro (GET /users, POST /users), pensamos en **Acciones de Negocio**.

- `tx: 101` -> "Iniciar Sesión"
- `tx: 205` -> "Aprobar Solicitud de Vacaciones"

Cada acción tiene un ID único. Esto facilita enormemente:

- **Auditoría**: "Quién ejecutó la tx 205?"
- **Permisos**: "El Rol X tiene permiso para tx 205?"

---

## 3. Glosario Fundamental

Antes de continuar, definamos el vocabulario que usaremos en toda la documentación.

| Término                  | Definición Simplificada                                                                             | Analogía                                                                               |
| :----------------------- | :-------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------- |
| **BO (Business Object)** | Módulo que agrupa una funcionalidad completa (Controller + Service + Repository).                   | Un "Departamento" de una empresa (e.g., Depto. de Ventas).                             |
| **Dispatcher**           | El componente que recibe la petición HTTP, busca qué BO la atiende, lo carga y lo ejecuta.          | El recepcionista del edificio que te dice a qué oficina ir.                            |
| **Container**            | Objeto que contiene todas las herramientas globales (DB, Logger, Config) y se pasa a todos los BOs. | Una caja de herramientas maestra que se le da a cada trabajador.                       |
| **Tx (Transaction ID)**  | Número único que identifica una operación específica.                                               | El número de turno en el banco.                                                        |
| **Zod**                  | Librería usada para validar que los datos de entrada sean correctos.                                | El guardia que revisa tu ID y mochila antes de entrar.                                 |
| **Lazy Loading**         | Técnica de cargar archivos solo cuando se necesitan, no al inicio.                                  | Encender la luz de una habitación solo cuando entras, no tener toda la casa encendida. |

---

## 4. ¿Para quién es esto?

- **Desarrolladores Backend**: Para construir APIs robustas.
- **Líderes Técnicos**: Para tener una base sólida y estandarizada para su equipo.
- **QA / Testers**: Para entender cómo probar los flujos transaccionales.

## Siguiente Paso

Ahora que entiendes la filosofía, veamos cómo está organizado el código físicamente en [Estructura de Archivos Detallada](FILE_STRUCTURE.es.md).
