# Framework Backend en Node.js - Arquitectura Modular y Segura

Bienvenido a la documentación oficial de **ToProccess**. Este es un framework backend robusto, diseñado pensando en la escalabilidad, mantenimiento y seguridad empresarial.

## ¿Qué es esto? (Concepto "Baby-Proof")

Imagina que estás construyendo una casa de Lego gigante. Si tiras todas las piezas en el suelo y empiezas a construir sin orden, terminarás con un desastre inestable.

Este framework es como **un kit de Lego organizado con instrucciones claras**:

- Tienes cajitas separadas para cada tipo de pieza (Lógica, Datos, Seguridad).
- Tienes conectores estándar para que las piezas encajen siempre (Inyección de Dependencias).
- Tienes un "Supervisor" que revisa que nadie construya cosas peligrosas (Security Service).

No tienes que inventar _cómo_ conectar las piezas, solo tienes que preocuparte de _qué_ quieres construir (tu lógica de negocio).

## Características Principales

1.  **Arquitectura Limpia (Clean Architecture)**:
    Tu lógica de negocio (Business Objects) no sabe nada de la base de datos ni del servidor web. Esto permite cambiar piezas sin romper todo el sistema.

2.  **Transaccionalidad por Diseño**:
    Todo lo que haces es una "Transacción" con un código único (e.g., `tx: 101`). Esto facilita el control de permisos y auditoría.

3.  **Seguridad Integrada**:
    No necesitas programar `if (user.isAdmin)` en cada línea. El sistema de seguridad verifica permisos _antes_ de que tu código se ejecute.

4.  **Validación Robusta**:
    Usamos **Zod** para asegurar que los datos que entran son perfectos. Si algo está mal, el sistema lo rechaza automáticamente con mensajes claros.

5.  **Internacionalización (i18n)**:
    Tus mensajes de error y éxito pueden hablar cualquier idioma. El sistema detecta el idioma del usuario y responde acorde.

## ¿Por dónde empiezo?

Si eres nuevo, sigue este orden:

1.  **[Instalación](../01-Getting-Started/INSTALLATION.es.md)**: Prepara tu máquina.
2.  **[Primeros Pasos](../01-Getting-Started/FIRST_RUN.es.md)**: Corre el proyecto.
3.  **[Arquitectura](../02-Architecture/OVERVIEW.es.md)**: Entiende el mapa general.
4.  **[Tu Primer BO](../05-Guides/CREATE_NEW_MODULE.es.md)**: Crea tu propia funcionalidad.
