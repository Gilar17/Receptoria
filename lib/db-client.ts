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
      ? process.env.LOCAL_DATABASE_URL ?? process.env.LOCAL_DIRECT_URL
      : process.env.DIRECT_URL ?? process.env.DATABASE_URL;

  if (!raw) {
    if (target === "local") {
      throw new Error(
        "Локальная БД не настроена. Добавьте LOCAL_DATABASE_URL в .env",
      );
    }
    throw new Error("DATABASE_URL или DIRECT_URL не задан");
  }

  return normalizeDatabaseUrl(raw);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function isRetryableDbError(error: unknown): boolean {
  if (typeof error !== "object" || error === null || !("code" in error)) {
    return false;
  }

  const code = String((error as { code: unknown }).code);
  return code === "P1001" || code === "P1002" || code === "P1017";
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
