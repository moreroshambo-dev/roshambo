# Stage 1: Build React frontend with Vite
FROM node:24.14.0-alpine AS builder

WORKDIR /app

RUN npm i -g pnpm

# Копируем package.json и package-lock.json
COPY package.json pnpm-lock.yaml ./

# Устанавливаем зависимости
RUN pnpm install

# Копируем исходники
COPY convex ./convex
COPY src ./src
COPY public ./public
COPY index.html vite.config.ts tsconfig.json tsconfig.app.json tsconfig.node.json ./

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