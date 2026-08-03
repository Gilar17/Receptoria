import { PrismaClient } from "@prisma/client";
import { resolveAppDatabaseUrl } from "@/lib/db-client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaDatabaseUrl: string | undefined;
};

function createPrismaClient(databaseUrl: string): PrismaClient {
  return new PrismaClient({
    datasources: { db: { url: databaseUrl } },
  });
}

function getPrismaClient(): PrismaClient {
  const databaseUrl = resolveAppDatabaseUrl();

  if (
    !globalForPrisma.prisma ||
    globalForPrisma.prismaDatabaseUrl !== databaseUrl
  ) {
    if (globalForPrisma.prisma) {
      void globalForPrisma.prisma.$disconnect();
    }
    globalForPrisma.prisma = createPrismaClient(databaseUrl);
    globalForPrisma.prismaDatabaseUrl = databaseUrl;
  }

  return globalForPrisma.prisma;
}

/** Один singleton PrismaClient на процесс; URL пересчитывается при первом обращении. */
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, property, receiver) {
    const client = getPrismaClient();
    const value = Reflect.get(client, property, receiver);
    return typeof value === "function" ? value.bind(client) : value;
  },
});

/** Для Auth.js PrismaAdapter — тот же singleton. */
export const authPrisma = prisma;
