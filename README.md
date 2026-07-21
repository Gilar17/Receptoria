# Receptoria

Сервис по обмену рецептами.

Стек: **Next.js (App Router) + Prisma + NeonDB (PostgreSQL)**. Готов к деплою на Vercel.

## Быстрый старт (PowerShell)

### 1. Установка зависимостей

```powershell
npm install
```

### 2. Настройка окружения

Скопируйте пример env и подставьте строки подключения из [Neon Console](https://console.neon.tech):

```powershell
Copy-Item .env.example .env
```

В `.env`:

- `DATABASE_URL` — pooled-строка (хост с `-pooler`) для приложения
- `DIRECT_URL` — direct-строка (без `-pooler`) для миграций Prisma

### 3. Миграция и seed

```powershell
npx prisma migrate deploy
npx prisma generate
npx prisma db seed
```

### 4. Локальный запуск

```powershell
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000) — главная страница читает сущности `Note` из PostgreSQL.

## Модель Note

| Поле      | Тип      |
|-----------|----------|
| id        | uuid     |
| title     | string   |
| createdAt | DateTime |

## Деплой на Vercel

1. Залейте репозиторий на GitHub.
2. Импортируйте проект в Vercel.
3. Добавьте переменные окружения `DATABASE_URL` и `DIRECT_URL` (те же, что в `.env`).
4. Deploy.

Скрипт `postinstall` выполняет `prisma generate` при сборке на Vercel.
