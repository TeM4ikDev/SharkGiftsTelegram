# Переменные окружения: разработка и продакшен

## Схема

| Режим        | Backend (NestJS)     | Client / Admin (Vite)        |
|-------------|----------------------|-----------------------------|
| Разработка  | `.env.development` или `.env` | `.env.development` или `.env` |
| Продакшен   | `.env.production` или переменные в Docker/хосте | `.env.production` (при сборке) или переменные при сборке |

---

## Backend

Бэкенд загружает файлы **в таком порядке** (позже переопределяет предыдущий):

1. `.env.development` при `NODE_ENV=development` (по умолчанию)
2. или `.env.production` при `NODE_ENV=production`
3. затем `.env` (общие или локальные переопределения)

Если файла нет (например, в Docker нет `.env.production`), используются только переменные из окружения.

### Локальная разработка

```bash
cd backend
# Вариант 1: один файл .env (как сейчас)
cp .env.example .env
# Вариант 2: отдельно для режимов
cp .env.example .env.development
# Заполните значения в .env или .env.development
npm run start:dev
```

### Продакшен (Docker)

Переменные задаются в `docker-compose.yml` или через `env_file`:

```yaml
environment:
  - NODE_ENV=production
  - DATABASE_URL=file:/app/data/dev.db
  # остальное из backend/.env или хоста
env_file:
  - backend/.env.production   # не коммитить, создать вручную на сервере
```

Либо создайте `backend/.env.production` на сервере и подключайте его через `env_file`.

---

## Client и Admin (Vite)

Vite сам подбирает файл по режиму:

- **`npm run dev`** → загружается `.env.development` и `.env.local`
- **`npm run build`** → загружается `.env.production` и `.env.production.local`

Доступ только к переменным с префиксом **`VITE_`**.

### Пример: разный API для dev и prod

**client/.env.development**

```env
# Обычно не нужен — в коде уже import.meta.env.DEV ? 'http://localhost:8080' : ''
# VITE_API_URL=http://localhost:8080
```

**client/.env.production**

```env
# Если API на другом домене:
# VITE_API_URL=https://api.example.com
```

В коде использовать: `import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:8080' : '')`.

**admin-panel** — аналогично: при необходимости завести `.env.development` / `.env.production` с `VITE_*` и в `constants.ts` читать `import.meta.env.VITE_API_URL` вместо захардкоженного продакшен-URL.

---

## Рекомендации

1. **Не коммитить** `.env`, `.env.development`, `.env.production` с реальными секретами.
2. В репозитории держать только **`.env.example`** с описанием переменных и пустыми/примерными значениями.
3. В продакшене (Docker) по возможности задавать секреты через **environment** или **secrets**, а не через файлы в образе.
