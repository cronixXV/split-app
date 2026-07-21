# Split App

Приложение для совместного учёта расходов и расчёта переводов между участниками комнаты.

Пользователь создаёт комнату, добавляет участников и расходы, после чего приложение рассчитывает балансы и формирует минимальный набор переводов для закрытия долгов.

## Возможности

- создание комнаты без регистрации;
- добавление участников;
- добавление и удаление расходов;
- выбор плательщика и участников разделения;
- автоматический расчёт балансов;
- минимизация количества переводов;
- realtime-синхронизация через Socket.IO;
- optimistic updates с rollback при ошибке API;
- восстановление состояния комнаты после перезагрузки;
- OCR-распознавание суммы с фотографии чека;
- адаптивный интерфейс для desktop и mobile;
- production-сборка через Docker и Nginx;
- Cypress E2E и GitHub Actions CI.

## Технологии

### Frontend

- React
- TypeScript
- Vite
- Effector
- TanStack Router
- HeroUI
- Tailwind CSS v4
- React Hook Form
- Yup
- Socket.IO Client
- Tesseract.js
- Feature-Sliced Design

### Backend

- Node.js
- Express
- TypeScript
- Sequelize
- PostgreSQL
- Socket.IO
- tsyringe
- Zod
- Pino
- Helmet
- express-rate-limit
- node-cron

### Infrastructure

- npm workspaces
- Docker
- Docker Compose
- Nginx
- Cypress
- ESLint
- GitHub Actions

## Архитектура

Проект организован как npm workspaces монорепозиторий:

```text
split-app/
├── client/                  # React-приложение
├── server/                  # Express API и Socket.IO
├── shared/                  # Общие типы и расчёты
├── cypress/                 # E2E-тесты
├── nginx.conf               # Production-конфигурация Nginx
├── docker-compose.prod.yml  # Production Docker Compose
├── cypress.config.cjs
└── package.json
```

### Поток запросов в production

```text
Browser
   ↓
Nginx
   ├── /                → статический frontend
   ├── /api/*           → Express API
   ├── /socket.io/*     → Socket.IO
   ├── /health          → health check
   └── /ready           → readiness check
```

## Основная бизнес-логика

Общие расчёты находятся в workspace `shared` и используются клиентом и сервером.

### Баланс участника

Положительный баланс означает, что участнику должны вернуть деньги.

Отрицательный баланс означает, что участник должен перевести деньги другим участникам.

### Переводы

На основе итоговых балансов приложение формирует набор переводов между должниками и получателями.

## Требования

Для локального запуска необходимы:

- Node.js 22;
- npm;
- Docker Desktop или Docker Engine;
- Docker Compose.

## Установка

```bash
git clone <repository-url>
cd split-app
npm ci
```

## Переменные окружения

Создай локальный `.env` на основе примера:

```bash
cp .env.example .env
```

Основные переменные:

```env
POSTGRES_DB=splitapp
POSTGRES_USER=user
POSTGRES_PASSWORD=change_me

PORT=3001
NODE_ENV=production
CLIENT_ORIGIN=http://localhost

LOG_LEVEL=info

RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100

ROOM_TTL_DAYS=30
CRON_CLEANUP_SCHEDULE=0 3 * * *
```

## Локальная разработка

Сначала установи зависимости:

```bash
npm ci
```

Запусти PostgreSQL:

```bash
docker compose up -d postgres
```

Запусти backend:

```bash
npm run dev --workspace=split-app-server
```

Запусти frontend в отдельном терминале:

```bash
npm run dev --workspace=split-app-client
```

Frontend будет доступен по адресу:

```text
http://localhost:5173
```

Backend:

```text
http://localhost:3001
```

## Production Docker Compose

Собрать и запустить production-стек:

```bash
docker compose \
  -f docker-compose.prod.yml \
  up -d --build
```

Проверить контейнеры:

```bash
docker compose \
  -f docker-compose.prod.yml \
  ps
```

Проверить готовность приложения:

```bash
curl http://localhost/ready
```

Остановить production-стек:

```bash
docker compose \
  -f docker-compose.prod.yml \
  down \
  --volumes \
  --remove-orphans
```

## Health checks

### Health

```http
GET /health
```

Показывает текущее состояние процесса.

### Readiness

```http
GET /ready
```

Показывает, готово ли приложение принимать запросы.

## Проверки качества

### TypeScript

```bash
npm run typecheck
```

### ESLint

```bash
npm run lint
```

Автоматическое исправление поддерживаемых нарушений:

```bash
npm run lint:fix
```

### Production build

```bash
npm run build --workspace=@shared/types
npm run build --workspace=split-app-server
npm run build --workspace=split-app-client
```

## E2E-тесты

E2E-тесты запускаются против production-стека.

Сначала подними приложение:

```bash
docker compose \
  -f docker-compose.prod.yml \
  up -d --build
```

Затем запусти Cypress:

```bash
npm run test:e2e
```

Открыть Cypress в интерактивном режиме:

```bash
npm run test:e2e:open
```

Текущий набор проверяет:

- создание комнаты;
- валидацию пустого названия;
- добавление участников;
- сохранение участников после перезагрузки;
- создание расхода;
- расчёт перевода;
- сохранение расхода после перезагрузки;
- доступность frontend и backend.

## CI

Workflow GitHub Actions запускается при:

- push в `main`;
- push в `develop`;
- pull request в `main`;
- ручном запуске через `workflow_dispatch`.

Пайплайн выполняет:

```text
TypeScript ─┐
ESLint ──────┼──→ Docker production stack → Cypress E2E
Build ───────┘
```

При падении E2E сохраняются:

- Cypress screenshots;
- Cypress videos;
- Docker Compose logs.

## Production hardening

На сервере реализованы:

- Helmet security headers;
- production CORS;
- проверка environment variables через Zod;
- structured logging через Pino;
- graceful shutdown;
- rate limiting;
- health и readiness endpoints;
- cron-очистка старых комнат.

## Realtime

Socket.IO используется для синхронизации комнаты между клиентами.

Реализованы:

- обновление участников и расходов;
- дедупликация событий;
- reconnect;
- resync после восстановления соединения;
- optimistic UI;
- rollback при ошибке API.

## OCR чеков

Для распознавания суммы используется Tesseract.js.

Сценарий:

```text
загрузка изображения
→ OCR
→ поиск итоговой суммы
→ передача суммы в форму расхода
```

OCR работает на клиенте и не требует отправки изображения на сервер.

## License

MIT License.
