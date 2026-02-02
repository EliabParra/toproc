# **Prompt: Análisis Exhaustivo de la Capa de Negocio (BOs) - ToProccess Framework**

## **CONTEXTO Y ROL**
Eres un **arquitecto senior especializado en análisis de código y diseño de sistemas transaccionales**. Has sido contratado para realizar un **análisis forense completo** de la capa de negocio (Business Objects) del framework ToProccess. Este no es un análisis superficial, sino una **disección minuciosa** que revelará cada aspecto, desde la estructura hasta las prácticas de código más sutiles.

## **OBJETIVO DEL ANÁLISIS**
Realizar una **auditoría técnica exhaustiva** que sirva como base para futuras decisiones de arquitectura. El análisis debe ser tan detallado que cualquier desarrollador senior pueda entender exactamente el estado actual de la capa de negocio, sus fortalezas, debilidades y oportunidades de mejora.

## **ÁMBITO DEL ANÁLISIS**
Analizar **TODO** lo relacionado con Business Objects en ToProccess:

1. **BOs abstractos/base**: Clases base, interfaces, patrones fundamentales
2. **BOs concretos generados**: Todos los BOs existentes en `BO/`
3. **Sistema de generación**: CLI `bo` y sus plantillas
4. **Integración con el núcleo**: Cómo los BOs interactúan con Security, Dispatcher, DB
5. **Documentación y convenciones**: Calidad y completitud de la documentación

## **METODOLOGÍA DE ANÁLISIS**

### **Fase 1: Análisis Estructural y Arquitectónico**
```typescript
// 1. Mapeo completo de la estructura de BOs
- ¿Cuántos BOs existen?
- ¿Cuál es la estructura de directorios de cada uno?
- ¿Hay consistencia en los nombres y organizaciones?

// 2. Análisis de dependencias entre BOs
- ¿Los BOs dependen entre sí? ¿Hay acoplamiento?
- ¿Cuáles son las dependencias externas (DB, servicios)?
- ¿Hay ciclos de dependencia?

// 3. Evaluación del cumplimiento de principios SOLID
- Single Responsibility: ¿Cada BO tiene una única razón para cambiar?
- Open/Closed: ¿Son fáciles de extender sin modificar?
- Liskov Substitution: ¿Se pueden sustituir unos por otros?
- Interface Segregation: ¿Las interfaces están bien segregadas?
- Dependency Inversion: ¿Dependen de abstracciones?
```

### **Fase 2: Análisis de Código y Calidad**
```typescript
// 1. Estadísticas cuantitativas detalladas
- Total de BOs
- Total de métodos por BO (mínimo, máximo, promedio)
- Total de líneas de código por BO
- Número de métodos públicos vs privados
- Complejidad ciclomática promedio por método

// 2. Análisis de tipado TypeScript
- Conteo de tipos `any` y `unknown`
- Conteo de `as` (type assertions) no seguras
- Porcentaje de cobertura de tipos en parámetros y retornos
- Tipos inferidos vs explícitos

// 3. Identificación de patrones y anti-patrones
- ¿Qué patrones de diseño se usan (Repository, Service, etc.)?
- ¿Hay código duplicado entre BOs?
- ¿Hay violaciones de principios de diseño?
- ¿Hay métodos que hacen demasiado (violación SRP)?

// 4. Calidad de validación y manejo de errores
- ¿Cómo se manejan los errores en los BOs?
- ¿Hay validación consistente de parámetros?
- ¿Los mensajes de error son claros y útiles?
```

### **Fase 3: Análisis de Documentación y Convenciones**
```typescript
// 1. Documentación en código (JSDoc)
- Porcentaje de métodos documentados
- Calidad de la documentación (parámetros, retornos, ejemplos)
- Consistencia en el formato de documentación

// 2. Documentación externa
- ¿Hay guías para crear nuevos BOs?
- ¿La documentación está actualizada con el código?
- ¿Hay ejemplos prácticos y tutoriales?

// 3. Convenciones y estándares
- ¿Hay un style guide para BOs?
- ¿Se siguen convenciones de naming consistentes?
- ¿Hay reglas sobre estructura de archivos?
```

### **Fase 4: Análisis de Generación y CLI**
```typescript
// 1. Análisis del CLI `bo`
- ¿Qué plantillas genera?
- ¿Son las plantillas óptimas?
- ¿Falta algo en las plantillas generadas?
- ¿El CLI valida inputs adecuadamente?

// 2. Calidad del código generado
- ¿El código generado sigue mejores prácticas?
- ¿Tiene buen tipado TypeScript?
- ¿Incluye documentación básica?
- ¿Es fácil extender/modificar lo generado?
```

### **Fase 5: Análisis de Integración con el Framework**
```typescript
// 1. Integración con el sistema transaccional
- ¿Cómo se mapean los métodos a transacciones?
- ¿Hay consistencia en la firma de métodos?
- ¿Cómo se manejan los permisos?

// 2. Integración con la base de datos
- ¿Patrones de acceso a datos consistentes?
- ¿Manejo adecuado de conexiones y transacciones?
- ¿Validación a nivel de base de datos vs negocio?

// 3. Integración con validación y mensajería
- ¿Usan el sistema de validación unificado?
- ¿Usan el sistema de mensajería internacionalizada?
- ¿Consistencia en respuestas de API?
```

## **FORMATO DEL REPORTE DE ANÁLISIS**

El análisis debe presentarse en un **reporte estructurado** con:

### **Sección 1: Resumen Ejecutivo**
- Estado general de la capa de negocio
- Principales hallazgos (3-5 puntos críticos)
- Recomendaciones de alto nivel

### **Sección 2: Métricas y Estadísticas**
```markdown
## 📊 ESTADÍSTICAS GENERALES

### Conteo de BOs
- Total BOs: [X]
- BOs activos (con métodos): [Y]
- BOs de ejemplo/plantilla: [Z]

### Distribución de métodos
- Métodos totales: [A]
- Promedio de métodos por BO: [B]
- BO con más métodos: [C] con [N] métodos
- BO con menos métodos: [D] con [M] métodos

### Calidad de tipado
- Total de `any`: [X]
- Total de `unknown`: [Y]
- Porcentaje de métodos completamente tipados: [Z]%

### Complejidad de código
- Complejidad ciclomática promedio: [X]
- Métodos con complejidad > 10: [Y]
- Líneas de código promedio por BO: [Z]
```

### **Sección 3: Hallazgos Detallados por Categoría**
```markdown
## 🔍 HALLADOS CRÍTICOS

### 1. Problemas de Tipado
- [ ] BO `UsuarioBO`: 15 usos de `any` en métodos públicos
- [ ] BO `ProductoBO`: Retorno `unknown` en método `buscar()`
- [ ] Patrón recurrente: falta de tipado en parámetros `params`

### 2. Violaciones de Principios SOLID
- [ ] BO `ReporteBO`: 412 líneas, viola Single Responsibility
- [ ] BO `FacturaBO`: Dependencia directa a `globalThis.db`
- [ ] BO `PedidoBO`: Método `procesar()` hace validación, cálculo y persistencia

### 3. Problemas de Documentación
- [ ] 40% de métodos sin JSDoc
- [ ] Documentación desactualizada en BO `AuthBO`
- [ ] Ejemplos de uso incorrectos en documentación

### 4. Inconsistencias en APIs
- [ ] 3 BOs usan `crear()` mientras 2 usan `create()`
- [ ] Inconsistencia en respuestas de error
- [ ] Diferentes patrones de validación
```

### **Sección 4: Análisis por BO Individual**
Para cada BO, proporcionar:
- **Nombre del BO** y ubicación
- **Métricas específicas** (líneas, métodos, complejidad)
- **Problemas identificados** (con ejemplos de código)
- **Fortalezas observadas**
- **Recomendaciones específicas**

### **Sección 5: Oportunidades de Mejora Priorizadas**
```markdown
## 🚀 OPORTUNIDADES PRIORIZADAS

### PRIORIDAD ALTA (Crítico)
1. **Estandarización de firmas de métodos**
   - Problema: Inconsistencia en parámetros y retornos
   - Impacto: Alta (afecta todo el sistema)
   - Esfuerzo: Medio

2. **Eliminación de tipos `any`**
   - Problema: 124 usos de `any` en BOs críticos
   - Impacto: Alta (seguridad y mantenibilidad)
   - Esfuerzo: Alto

### PRIORIDAD MEDIA (Importante)
1. **Refactorización de BOs gigantes**
   - Problema: 3 BOs > 400 líneas
   - Impacto: Medio
   - Esfuerzo: Alto

2. **Mejora de documentación**
   - Problema: 40% de métodos sin documentar
   - Impacto: Medio
   - Esfuerzo: Bajo
```

### **Sección 6: Recomendaciones de Arquitectura**
```markdown
## 🏗️ RECOMENDACIONES ESTRATÉGICAS

### Corto Plazo (Sprint próximo)
1. Crear interfaz base para todos los BOs
2. Estandarizar firmas de métodos
3. Implementar validación automática con Zod

### Medio Plazo (1-2 sprints)
1. Refactorizar BOs que violan SRP
2. Implementar sistema de testing para BOs
3. Crear plantillas mejoradas para CLI

### Largo Plazo (3+ sprints)
1. Implementar sistema de eventos entre BOs
2. Crear sistema de métricas automáticas
3. Implementar cache a nivel de BO
```

### **Sección 7: Apéndices Técnicos**
- **Diagramas**: Dependencias entre BOs, estructura típica
- **Ejemplos de código**: Buenos y malos ejemplos
- **Checklist de calidad**: Para nuevos BOs
- **Glosario de términos**: Específicos del dominio

## **HERRAMIENTAS Y MÉTRICAS A UTILIZ**

El análisis debe incluir datos de:

1. **ESLint con reglas estrictas** para TypeScript
2. **ts-prune** para detectar código no utilizado
3. **complexity-report** para métricas de complejidad
4. **jscpd** para detección de código duplicado
5. **typedoc** para analizar documentación
6. **depcruise** para analizar dependencias

## **INSTRUCCIONES ESPECÍFICAS PARA EL AGENTE**

Como arquitecto senior, tu tarea es:

1. **Realizar un análisis exhaustivo**, no apresurado
2. **Proveer evidencias concretas** (ejemplos de código, métricas)
3. **Ser objetivo y balanceado** (señalar fortalezas y debilidades)
4. **Priorizar hallazgos** por impacto y esfuerzo
5. **Preparar el terreno para decisiones futuras** sin implementar cambios
6. **Documentar todo** de manera que pueda ser revisado y discutido

## **ENTREGABLES ESPERADOS**

1. **Reporte de análisis completo** en formato estructurado
2. **Dashboard de métricas** (puede ser en texto o formato simple)
3. **Lista priorizada de acciones** con estimación de esfuerzo
4. **Recomendaciones arquitectónicas** con pros y contras
5. **Ejemplos específicos** de problemas y soluciones

## **PROCESO DE TRABAJO**

1. **Recolección**: Analizar todos los archivos en `BO/` y relacionados
2. **Procesamiento**: Ejecutar herramientas de análisis estático
3. **Síntesis**: Organizar hallazgos en categorías
4. **Priorización**: Identificar qué es crítico vs qué puede esperar
5. **Comunicación**: Presentar hallazgos de manera clara y accionable

## **PALABRAS FINALES**

Este análisis no es solo un checklist técnico, es una **radiografía completa** de la salud de la capa de negocio de ToProccess. Debe servir como **base de datos de decisiones técnicas** para los próximos meses.

**Comienza con:**
```
🔍 INICIANDO ANÁLISIS EXHAUSTIVO DE CAPA DE NEGOCIO - TOPROCESS FRAMEWORK

FASE 1: Recopilación de datos y métricas iniciales...
```

**Después de cada fase, proporciona un avance conciso pero sustancial.** Espera mi feedback en puntos clave antes de proceder a conclusiones finales.

**¿Listo para diseccionar la capa de negocio de ToProccess? ¡Comienza ahora!**