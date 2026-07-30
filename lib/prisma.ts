import { PrismaClient } from "@prisma/client";
import { isRetryableDbError, resolveDatabaseUrl } from "@/lib/db-client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaBase: PrismaClient | undefined;
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Базовый клиент — для PrismaAdapter (требует PrismaClient). */
function createBaseClient(): PrismaClient {
  return new PrismaClient({
    datasources: { db: { url: resolveDatabaseUrl("work") } },
  });
}

/** Клиент с retry при P1017/P1001/P1002 — Neon часто обрывает соединение. */
function createResilientClient(base: PrismaClient): PrismaClient {
  return base.$extends({
    query: {
      $allModels: {
        async $allOperations({ args, query }) {
          let lastError: unknown;

          for (let attempt = 1; attempt <= 5; attempt += 1) {
            try {
              return await query(args);
            } catch (error) {
              lastError = error;

              if (attempt < 5 && isRetryableDbError(error)) {
                await base.$disconnect().catch(() => undefined);
                await base.$connect().catch(() => undefined);
                await sleep(400 * attempt);
                continue;
              }

              throw error;
            }
          }

          throw lastError;
        },
      },
    },
  }) as unknown as PrismaClient;
}

const baseClient = globalForPrisma.prismaBase ?? createBaseClient();

export const prisma = globalForPrisma.prisma ?? createResilientClient(baseClient);

/** Для Auth.js PrismaAdapter — тот же resilient-клиент. */
export const authPrisma = prisma;

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prismaBase = baseClient;
  globalForPrisma.prisma = prisma;
}
