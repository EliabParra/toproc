# --- Etapa 1: Builder (Constructor) ---
FROM node:20-alpine AS builder

# Habilitamos Corepack para tener pnpm disponible
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copiamos los archivos de definición de dependencias
# Incluimos pnpm-lock.yaml si existe
COPY package.json pnpm-lock.yaml* ./

# Instalamos TODAS las dependencias
RUN pnpm install --frozen-lockfile

# Copiamos el resto del código fuente
COPY . .

# Construimos la aplicación
RUN pnpm run build

# --- Etapa 2: Runner (Ejecución en Producción) ---
FROM node:20-alpine AS runner

# Habilitamos Corepack también en la etapa final
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

ENV NODE_ENV=production

# Copiamos archivos de dependencias
COPY package.json pnpm-lock.yaml* ./

# Instalamos SOLO dependencias de producción
RUN pnpm install --prod --frozen-lockfile

# Copiamos los artefactos construidos
COPY --from=builder /app/dist ./dist

# Seguridad: Usuario no-root
RUN addgroup -S toproc && adduser -S toproc -G toproc
USER toproc

EXPOSE 3000

CMD ["node", "dist/src/index.js"]
