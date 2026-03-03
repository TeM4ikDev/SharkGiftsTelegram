# Запуск проекта в Docker

## Требования

- Docker
- Docker Compose

## Сборка и запуск

Из корня проекта:

```bash
docker compose up --build
```

Приложение будет доступно:

- **Клиент (основной фронт):** http://localhost:8080  
- **Админ-панель:** http://localhost:8080/admin  
- **API:** http://localhost:8080/api  

## Только сборка образа

```bash
docker compose build
```

## Запуск в фоне

```bash
docker compose up -d
```

## Остановка

```bash
docker compose down
```

Чтобы удалить и данные БД (volume):

```bash
docker compose down -v
```

## Данные

- SQLite-база хранится в Docker volume `app-data` и сохраняется между перезапусками.
- При первом запуске выполняются миграции Prisma (`prisma migrate deploy`).
- Секреты (JWT, бот, платёжные ключи и т.д.) задаются через переменные окружения. Можно добавить в `docker-compose.yml`:

  ```yaml
  env_file:
    - backend/.env
  ```

  и при необходимости переопределить отдельные переменные в секции `environment`.

## Локальная разработка без Docker

Для запуска бэкенда локально в `backend/.env` должен быть указан `DATABASE_URL`, например:

```env
DATABASE_URL="file:./prisma/dev.db"
```

(как в текущем `.env`).
