# --- Etapa 1: Builder (Constructor) ---
# Usamos una imagen base ligera de Node.js (Alpine Linux) para construir la app
# AS builder: Le damos un nombre a esta etapa para referenciarla después
FROM node:20-alpine AS builder

# Establecemos el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copiamos los archivos de definición de dependencias primero
# ¿Por qué? Docker usa un sistema de capas (cache). Si package.json no cambia,
# Docker reusará esta capa y no reinstalará las dependencias, ahorrando mucho tiempo.
COPY package*.json ./

# Instalamos TODAS las dependencias (incluyendo devDependencies como TypeScript)
# 'npm ci' es más rápido y estricto que 'npm install' para entornos automatizados
RUN npm ci

# Copiamos el resto del código fuente
COPY . .

# Construimos la aplicación (Compilación TypeScript -> JavaScript)
# Esto genera la carpeta /dist
RUN npm run build

# --- Etapa 2: Runner (Ejecución en Producción) ---
# Iniciamos una nueva etapa limpia para tener una imagen final muy pequeña
FROM node:20-alpine AS runner

WORKDIR /app

# Configuramos variables de entorno para producción
# Esto optimiza el rendimiento de Node.js (menos logs, desactiva funciones de debug)
ENV NODE_ENV=production

# Copiamos solo package.json de nuevo para instalar solo dependencias de producción
COPY package*.json ./

# Instalamos SOLO dependencias de producción
# Esto reduce drásticamente el tamaño de la imagen final y mejora la seguridad
RUN npm ci --only=production

# Copiamos los artefactos construidos desde la etapa 'builder'
# --from=builder: La magia de Multi-stage build
COPY --from=builder /app/dist ./dist

# Creamos un usuario no-root por seguridad
# Ejecutar como root es un riesgo de seguridad. Creamos 'toproc' y lo usamos.
RUN addgroup -S toproc && adduser -S toproc -G toproc
USER toproc

# Exponemos el puerto donde corre la app
EXPOSE 3000

# Comando por defecto al iniciar el contenedor
CMD ["node", "dist/src/index.js"]
