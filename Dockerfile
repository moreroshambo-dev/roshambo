# Stage 1: Build React frontend with Vite
FROM node:24.14.0-alpine AS builder

WORKDIR /app

RUN npm i -g pnpm

# Копируем package.json и lockfile
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/front/package.json packages/front/.

# Устанавливаем зависимости
RUN pnpm install

# Копируем исходники
COPY convex ./convex
COPY packages/front ./packages/front
COPY tsconfig.json ./

# Собираем фронтенд
RUN pnpm run build

# Stage 2: Production with Caddy
FROM caddy:2.11.2-alpine

# Копируем Caddyfile
COPY Caddyfile /etc/caddy/Caddyfile

# Копируем собранный фронтенд
COPY --from=builder /app/dist /app/dist

# Экспонируем порты
EXPOSE 80 443

# Caddy запускается автоматически и использует /etc/caddy/Caddyfile
