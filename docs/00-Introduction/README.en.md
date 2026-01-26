# Node.js Backend Framework - Modular & Secure Architecture

Welcome to the official **ToProccess** documentation. This is a clear, robust backend framework designed for scalability, maintainability, and enterprise-grade security.

## What is this? ("Baby-Proof" Concept)

Imagine you are building a giant Lego house. If you dump all the pieces on the floor and start building without a plan, you'll end up with an unstable mess.

This framework is like **an organized Lego kit with clear instructions**:

- You have separate boxes for each type of piece (Logic, Data, Security).
- You have standard connectors so pieces always fit together (Dependency Injection).
- You have a "Supervisor" checking that no one builds dangerous things (Security Service).

You don't have to invent _how_ to connect the pieces, you just worry about _what_ you want to build (your business logic).

## Key Features

1.  **Clean Architecture**:
    Your business logic (Business Objects) knows nothing about the database or the web server. This allows you to swap parts without breaking the whole system.

2.  **Transactional by Design**:
    Everything you do is a "Transaction" with a unique code (e.g., `tx: 101`). This makes permission control and auditing extremely easy.

3.  **Integrated Security**:
    You don't need to code `if (user.isAdmin)` on every line. The security system checks permissions _before_ your code even runs.

4.  **Robust Validation**:
    We use **Zod** to ensure incoming data is perfect. If something is wrong, the system automatically rejects it with clear messages.

5.  **Internationalization (i18n)**:
    Your error and success messages can speak any language. The system detects the user's language and responds accordingly.

## Where do I start?

If you are new, follow this path:

1.  **[Installation](../01-Getting-Started/INSTALLATION.en.md)**: Setup your machine.
2.  **[First Run](../01-Getting-Started/FIRST_RUN.en.md)**: Run the project.
3.  **[Architecture](../02-Architecture/OVERVIEW.en.md)**: Understand the big picture.
4.  **[Your First BO](../05-Guides/CREATE_NEW_MODULE.en.md)**: Create your own feature.
