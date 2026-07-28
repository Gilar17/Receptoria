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

## Авторизация через Google

Receptoria использует **Auth.js v5** (пакет `next-auth`) с **Google OAuth** и server-side сессиями в PostgreSQL (стратегия `database`).

### Переменные окружения

Добавьте в `.env` локально и в настройках Vercel:

| Переменная | Описание |
|------------|----------|
| `AUTH_SECRET` | Секрет для подписи сессий |
| `GOOGLE_CLIENT_ID` | Client ID из Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | Client Secret из Google Cloud Console |
| `DATABASE_URL` | Строка подключения (уже нужна для Prisma) |

Опционально на Vercel:

| Переменная | Описание |
|------------|----------|
| `AUTH_URL` | `https://receptoria.vercel.app` |

### Создание AUTH_SECRET

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Скопируйте вывод в `AUTH_SECRET` (локально и на Vercel). Не публикуйте значение в репозитории.

### OAuth-приложение Google

1. Откройте [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials).
2. Создайте **OAuth 2.0 Client ID** типа **Web application**.
3. В **Authorized redirect URIs** добавьте:

**Локально:**

```
http://localhost:3000/api/auth/callback/google
```

**Production (Vercel):**

```
https://receptoria.vercel.app/api/auth/callback/google
```

4. Скопируйте Client ID и Client Secret в `GOOGLE_CLIENT_ID` и `GOOGLE_CLIENT_SECRET`.

### Миграция таблиц Auth.js

Миграция `20260728220000_add_auth` добавляет модели `Account`, `Session`, `VerificationToken` и поля `image`, `emailVerified` в `User`.

Локально (через `LOCAL_DIRECT_URL`, не меняя Neon):

```powershell
$localLine = Select-String -Path .env -Pattern '^LOCAL_DIRECT_URL=' | Select-Object -First 1
$localUrl = $localLine.Line -replace '^LOCAL_DIRECT_URL=','' -replace '^"|"$',''
$env:DATABASE_URL = $localUrl
$env:DIRECT_URL = $localUrl
npx prisma migrate deploy
Remove-Item Env:DATABASE_URL, Env:DIRECT_URL
```

Для Neon применяйте `npx prisma migrate deploy` только после отдельного подтверждения.

### Проверка входа и выхода

```powershell
npm run dev
```

1. Откройте [http://localhost:3000/login](http://localhost:3000/login).
2. Нажмите **«Войти через Google»** — после успеха редирект на `/dashboard`.
3. На `/dashboard` отображаются имя, email и аватар (если есть).
4. Нажмите **«Выйти»** — редирект на `/login`.

### Проверка защиты маршрутов

| Маршрут | Без входа | С входом |
|---------|-----------|----------|
| `/dashboard` | редирект на `/login` | доступен |
| `/my-recipes` | редирект на `/login` | только свои рецепты |
| `/login` | страница входа | редирект на `/dashboard` |

Middleware выполняет предварительный редирект; окончательная проверка — в server components через `auth()` и `requireAuth()`.
