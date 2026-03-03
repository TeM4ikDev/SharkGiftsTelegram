# ========== Stage 1: Client (React/Vite) ==========
# Debian (slim) вместо Alpine: нативный @swc/core стабильно работает на glibc
FROM node:20-slim AS client-builder
WORKDIR /app/client
COPY client/package.json client/package-lock.json* ./
RUN npm install
COPY client/ .
RUN npm run build

# ========== Stage 2: Admin panel (Refine/Vite) ==========
FROM node:20-alpine AS admin-builder
WORKDIR /app/admin-panel
COPY admin-panel/package.json admin-panel/package-lock.json* ./
RUN npm ci --legacy-peer-deps
COPY admin-panel/ .
RUN npm run build

# ========== Stage 3: Backend (NestJS) ==========
FROM node:20-alpine AS backend-builder
WORKDIR /app/backend
COPY backend/package.json backend/package-lock.json* ./
RUN npm ci --legacy-peer-deps
COPY backend/ .
COPY --from=client-builder /app/client/dist ../client/dist
COPY --from=admin-builder /app/admin-panel/dist ../admin-panel/dist
RUN npx prisma generate
RUN npm run build

# ========== Stage 4: Runtime ==========
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache dumb-init su-exec
COPY --from=backend-builder /app/backend/dist ./backend/dist
COPY --from=backend-builder /app/backend/node_modules ./backend/node_modules
COPY --from=backend-builder /app/backend/package.json ./backend/package.json
COPY --from=backend-builder /app/backend/prisma ./backend/prisma
COPY --from=client-builder /app/client/dist ./client/dist
COPY --from=admin-builder /app/admin-panel/dist ./admin-panel/dist
COPY backend/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh
WORKDIR /app/backend
EXPOSE 8080
ENV DATABASE_URL=file:/app/data/dev.db
ENTRYPOINT ["dumb-init", "--", "/docker-entrypoint.sh", "sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
