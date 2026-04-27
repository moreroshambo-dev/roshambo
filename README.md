# Workspace Overview

Монорепа состоит из фронтенда в `packages/front` и backend-части на Convex в корне.

## Структура

```text
.
├── packages/
│   └── front/            # Vite/React frontend package
├── convex/               # Convex schema, functions, auth, _generated types
├── local-dev/            # self-hosted Convex через Docker Compose
├── keys/                 # ключи и публичные артефакты интеграций
├── dist/                 # результат frontend build
├── package.json          # корневые скрипты workspace + Convex CLI
├── pnpm-workspace.yaml   # описание workspace-пакетов
└── Dockerfile            # сборка статического frontend-образа
```

## Пакеты и директории

- `packages/front`
  - Отдельный workspace-пакет фронтенда.
  - Содержит `src`, `public`, `index.html`, `vite.config.ts`, `tsconfig*`, `components.json`.
  - Импортирует backend-типизацию и часть shared-логики из корневого `convex/` через алиас `@/convex/*`.

- `convex`
  - Convex schema, queries, mutations, actions, auth-конфиг и HTTP routes.
  - `convex/_generated/*` генерируется CLI-командами `convex dev` или `convex codegen`.

- `local-dev`
  - `docker-compose.yaml` для self-hosted Convex backend + dashboard.
  - `generateKeys.mjs` генерирует `JWT_PRIVATE_KEY` и `JWKS` для локальной auth-схемы.

- `keys`
  - Вспомогательные ключи для интеграций, например для депозитов.

## Env Files

- `.env.local`
  - Основной локальный runtime-конфиг приложения и backend-логики.
- `.env.convex.local`
  - Явный target для локального self-hosted Convex CLI.
- `.env.convex.prod`
  - Явный target для production self-hosted Convex CLI.
- `local-dev/.env.local`
  - Переменные для `docker compose` self-hosted Convex.
- `.env.prod`
  - Production-like конфиг.
- `.env`
  - Базовый/shared конфиг.

## Переменные окружения

### Convex / auth

- `CONVEX_SITE_URL`
  - URL issuer-а для `convex/auth.config.ts`.
  - Для локального self-hosted сценария обычно это `http://127.0.0.1:3211`.

- `CONVEX_SELF_HOSTED_URL`
  - URL self-hosted Convex backend для CLI.

- `CONVEX_SELF_HOSTED_ADMIN_KEY`
  - Admin key для CLI при работе с self-hosted Convex.

### Convex CLI target files

- `.env.convex.local`
  - Держит только `CONVEX_SELF_HOSTED_URL` и `CONVEX_SELF_HOSTED_ADMIN_KEY` для локального Docker Convex.

- `.env.convex.prod`
  - Держит только `CONVEX_SELF_HOSTED_URL` и `CONVEX_SELF_HOSTED_ADMIN_KEY` для production Convex на Railway.

- `JWT_PRIVATE_KEY`
  - Приватный ключ для подписи JWT.
  - Может быть сгенерирован через `node local-dev/generateKeys.mjs`.

- `JWKS`
  - Публичная JWKS, соответствующая `JWT_PRIVATE_KEY`.

### Frontend / proxy

- `VITE_CONVEX_URL`
  - Используется Vite preview proxy в `packages/front/vite.config.ts`.
  - Для `pnpm dev` proxy сейчас настроен напрямую на `http://127.0.0.1:3210`.

### Telegram

- `TG_BOT_TOKEN`
  - Используется backend-валидацией Telegram Mini App init data.

### Deposits / Ton Pay

- `TON_PAY_VAULT_ADDRESS`
  - Адрес vault-а для deposit flow в `convex/deposits/tonPay/*`.

- `TON_PAY_API_KEY`
  - Опциональный API key для Ton Pay transfer creation.

- `DEPOSIT_SIGNATURE_HEADER`
  - Имя HTTP header-а, из которого backend читает подпись deposit callback.

- `DEPOSIT_API_PUBLIC_KEY`
  - Публичный ключ для проверки подписей deposit callback-ов.

### Local Docker Compose

- `PORT`
  - Порт backend-а Convex.

- `SITE_PROXY_PORT`
  - Порт site proxy / auth issuer.

- `CONVEX_CLOUD_ORIGIN`
  - Origin backend-а для self-hosted режима.

## Важные замечания по env

- `convex` CLI теперь не зависит от корневого `.env.local` для выбора deployment-а.
- Выбор target-а для CLI вынесен в `.env.convex.local` и `.env.convex.prod`.
- `CONVEX_SITE_URL` должен совпадать с issuer-ом JWT и отдавать Convex Auth discovery:
  - `${CONVEX_SITE_URL}/.well-known/openid-configuration`
  - `${CONVEX_SITE_URL}/.well-known/jwks.json`
- Для self-hosted Convex `JWT_PRIVATE_KEY` и `JWKS` должны быть одной парой ключей. Генерируйте и обновляйте их вместе через `node local-dev/generateKeys.mjs`; если поменять только одно значение, Convex Auth начнет падать с ошибкой проверки подписи OIDC token.
- После смены `CONVEX_SITE_URL`, `JWT_PRIVATE_KEY` или `JWKS` перезапустите/redeploy backend и сбросьте cached auth token на фронте. В Telegram WebView старый JWT может оставаться в `localStorage`; безопасный способ принудительного сброса для всех пользователей — bump `storageNamespace` в `ConvexAuthProvider`.
- В коде backend-а используется `TON_PAY_VAULT_ADDRESS`.
- В `.env` и `.env.prod` сейчас также встречается `TON_VAULT_ADDRESS`.
- Это выглядит как legacy-имя и текущим кодом не читается.

## Команды

### Frontend

- `pnpm dev`
  - Запускает frontend dev server из `packages/front`.

- `pnpm build`
  - Typecheck + production build фронта.

- `pnpm preview`
  - Поднимает preview frontend build.

- `pnpm lint`
  - Запускает ESLint по репозиторию.

### Convex CLI

- `pnpm convex:local -- <command>`
  - Выполняет любую Convex CLI команду против локального self-hosted deployment-а.
  - Пример: `pnpm convex:local -- env list`

- `pnpm convex:prod -- <command>`
  - Выполняет любую Convex CLI команду против production deployment-а на Railway.
  - Пример: `pnpm convex:prod -- logs`

- `pnpm convex:deploy`
  - Деплой backend-части в production target.

- `pnpm convex:deploy:local`
  - Деплой backend-части в локальный self-hosted target.

- `pnpm convex:deploy:prod`
  - Явный алиас для production deploy.

- `pnpm convex:dev`
  - Запускает `convex dev` против локального target-а.
  - Заодно обновляет `convex/_generated/*`.

- `pnpm convex:codegen`
  - Только регенерирует типы Convex против локального target-а.

- `pnpm convex:logs`
  - Смотрит логи локального target-а.

- `pnpm convex:logs:prod`
  - Смотрит логи production target-а.

- `pnpm convex:env`
  - Показывает env локального target-а.

- `pnpm convex:env:prod`
  - Показывает env production target-а.

- `pnpm convex:data`
  - Просмотр таблиц и данных локального target-а.

- `pnpm convex:data:prod`
  - Просмотр таблиц и данных production target-а.

### Self-hosted Convex

- `pnpm convex:self-hosted:up`
  - Поднимает локальный self-hosted Convex и dashboard через Docker Compose.
  - Dashboard открывается по адресу `http://127.0.0.1:6791`.
  - Convex backend/cloud API доступен на `http://127.0.0.1:3210`.
  - Site proxy / auth issuer доступен на `http://127.0.0.1:3211`.
  - `http://127.0.0.1:3211` не является dashboard; это публичная site-прокси поверхность, где живут HTTP routes и Convex Auth discovery.
  - `CONVEX_SITE_URL` внутри Convex является built-in переменной и не меняется через `convex env set`. Для локального self-hosted issuer-а меняйте `CONVEX_SITE_ORIGIN` в `local-dev/.env.local` и пересоздавайте backend container. Для Telegram/ngrok сценария `CONVEX_SITE_ORIGIN` должен совпадать с публичным issuer-ом, например `https://rps.ngrok.dev`.

- `pnpm convex:self-hosted:down`
  - Останавливает локальный self-hosted Convex.

- `pnpm convex:self-hosted:logs`
  - Показывает логи self-hosted сервисов.

## Рекомендуемый локальный flow

1. Поднять self-hosted backend:

```bash
pnpm convex:self-hosted:up
```

2. Запустить Convex watcher/codegen:

```bash
pnpm convex:dev
```

3. В отдельном терминале поднять frontend:

```bash
pnpm dev
```

### Полезные production-команды

```bash
pnpm convex:deploy
pnpm convex:logs:prod
pnpm convex:env:prod
pnpm convex:prod -- data
```

## Технические заметки

- `pnpm dev` поднимает только frontend. Backend/self-hosted Convex нужно запускать отдельно.
- `packages/front` использует код и типы из корневого `convex/`, поэтому ошибки в `convex/**` могут ломать frontend build/typecheck.
- Production static build по-прежнему собирается в корневой `dist/`.
