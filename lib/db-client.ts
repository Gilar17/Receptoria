import { PrismaClient } from "@prisma/client";

export type DbTarget = "local" | "work";

function normalizeDatabaseUrl(raw: string): string {
  const url = new URL(raw);
  url.searchParams.delete("channel_binding");
  url.searchParams.set("connect_timeout", "60");

  if (url.hostname.includes("-pooler") && !url.searchParams.has("pgbouncer")) {
    url.searchParams.set("pgbouncer", "true");
  }

  return url.toString();
}

export function resolveDatabaseUrl(target: DbTarget = "work"): string {
  const raw =
    target === "local"
      ? process.env.LOCAL_DIRECT_URL
      : process.env.DIRECT_URL ?? process.env.DATABASE_URL;

  if (!raw) {
    if (target === "local") {
      throw new Error(
        "Локальная БД не настроена. Добавьте LOCAL_DIRECT_URL в .env",
      );
    }
    throw new Error("DATABASE_URL или DIRECT_URL не задан");
  }

  return normalizeDatabaseUrl(raw);
}

/** Runtime-подключение приложения: DATABASE_URL (Neon pooler), не DIRECT_URL. */
export function resolveAppDatabaseUrl(): string {
  const raw = process.env.DATABASE_URL ?? process.env.DIRECT_URL;

  if (!raw) {
    throw new Error("DATABASE_URL не задан");
  }

  return normalizeDatabaseUrl(raw);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function extractDbErrorCode(error: unknown): string {
  if (typeof error === "object" && error !== null && "code" in error) {
    return String((error as { code: unknown }).code);
  }
  if (error instanceof Error && /ECONNRESET/i.test(error.message)) {
    return "ECONNRESET";
  }
  return "UNKNOWN";
}

export function isRetryableDbError(error: unknown): boolean {
  return isTransientDbError(error);
}

/** Временные ошибки соединения — повтор только на уровне целой операции. */
export function isTransientDbError(error: unknown): boolean {
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = String((error as { code: unknown }).code);
    if (code === "P1001" || code === "P1017") {
      return true;
    }
  }

  const message = error instanceof Error ? error.message : String(error);
  return /Server has closed the connection|connection reset|connection terminated|ECONNRESET/i.test(
    message,
  );
}

const RETRY_DELAYS_MS = [750, 1500] as const;

/**
 * Повторяет одну целую async-операцию при временных ошибках БД.
 * Функция operation вызывается заново на каждой попытке.
 */
export async function withDbRetry<T>(
  operationName: string,
  operation: () => Promise<T>,
  maxAttempts = 3,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (attempt < maxAttempts && isTransientDbError(error)) {
        console.warn("[DB retry]", {
          attempt,
          code: extractDbErrorCode(error),
          operationName,
        });
        await sleep(RETRY_DELAYS_MS[attempt - 1] ?? 1500);
        continue;
      }

      throw error;
    }
  }

  throw lastError;
}

type WithDbOptions = {
  attempts?: number;
  target?: DbTarget;
};

export async function withDb<T>(
  label: string,
  fn: (prisma: PrismaClient) => Promise<T>,
  options: WithDbOptions = {},
): Promise<T> {
  const attempts = options.attempts ?? 5;
  const target = options.target ?? "work";
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const prisma = new PrismaClient({
      datasources: { db: { url: resolveDatabaseUrl(target) } },
    });

    try {
      return await fn(prisma);
    } catch (error) {
      lastError = error;

      if (attempt < attempts && isRetryableDbError(error)) {
        console.log(`${label}: повтор ${attempt}/${attempts}`);
        await sleep(1500 * attempt);
        continue;
      }

      throw error;
    } finally {
      await prisma.$disconnect();
    }
  }

  throw lastError;
}
