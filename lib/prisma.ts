import { PrismaClient } from "@prisma/client";
import { resolveAppDatabaseUrl } from "@/lib/db-client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    datasources: { db: { url: resolveAppDatabaseUrl() } },
  });
}

/** Один singleton PrismaClient на процесс (globalThis в development). */
export const prisma = globalForPrisma.prisma ?? createPrismaClient();

/** Для Auth.js PrismaAdapter — тот же singleton. */
export const authPrisma = prisma;

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
