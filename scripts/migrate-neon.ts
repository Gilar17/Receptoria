/**
 * Prisma migrate для Neon с нестабильным соединением.
 *
 * Neon: P1017 (обрыв), P1002 (advisory lock) — обход через DIRECT_URL,
 * PRISMA_SCHEMA_DISABLE_ADVISORY_LOCK и пошаговое применение с retry.
 *
 * Если SQL уже частично/полностью применён, но запись в _prisma_migrations
 * отсутствует — миграция помечается как applied (resolve).
 */
import { config } from "dotenv";
import { createHash, randomUUID } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { PrismaClient } from "@prisma/client";

config();

const RETRYABLE = /P1001|P1002|P1017|closed the connection|timed out/i;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function directUrl(): string {
  const raw = process.env.DIRECT_URL;
  if (!raw) throw new Error("DIRECT_URL не задан в .env");
  const url = new URL(raw);
  url.searchParams.delete("channel_binding");
  url.searchParams.set("connect_timeout", "120");
  return url.toString();
}

function createClient(): PrismaClient {
  return new PrismaClient({
    datasources: { db: { url: directUrl() } },
  });
}

async function withRetry<T>(
  label: string,
  fn: (prisma: PrismaClient) => Promise<T>,
  attempts = 8,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const prisma = createClient();
    try {
      await prisma.$connect();
      return await fn(prisma);
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message : String(error);
      const code =
        typeof error === "object" && error && "code" in error
          ? String((error as { code: unknown }).code)
          : "";

      if (
        attempt < attempts &&
        (RETRYABLE.test(message) ||
          code === "P1001" ||
          code === "P1002" ||
          code === "P1017")
      ) {
        console.log(`${label}: повтор ${attempt}/${attempts}`);
        await sleep(2000 * attempt);
        continue;
      }
      throw error;
    } finally {
      await prisma.$disconnect().catch(() => undefined);
    }
  }

  throw lastError;
}

function splitSqlStatements(sql: string): string[] {
  return sql
    .split(";")
    .map((part) => part.trim())
    .filter((part) => part.length > 0 && !part.startsWith("--"));
}

function listMigrationDirs(): string[] {
  const dir = join(process.cwd(), "prisma", "migrations");
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

function migrationChecksum(name: string): string {
  const sql = readFileSync(
    join(process.cwd(), "prisma", "migrations", name, "migration.sql"),
    "utf8",
  );
  return createHash("sha256").update(sql).digest("hex");
}

async function tableExists(
  prisma: PrismaClient,
  table: string,
): Promise<boolean> {
  const rows = await prisma.$queryRaw<{ exists: boolean }[]>`
    SELECT EXISTS (
      SELECT 1 FROM pg_tables
      WHERE schemaname = 'public' AND tablename = ${table}
    ) AS exists
  `;
  return Boolean(rows[0]?.exists);
}

async function columnExists(
  prisma: PrismaClient,
  table: string,
  column: string,
): Promise<boolean> {
  const rows = await prisma.$queryRaw<{ exists: boolean }[]>`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = ${table}
        AND column_name = ${column}
    ) AS exists
  `;
  return Boolean(rows[0]?.exists);
}

async function isAuthMigrationApplied(prisma: PrismaClient): Promise<boolean> {
  const [account, session, token, emailVerified, image] = await Promise.all([
    tableExists(prisma, "Account"),
    tableExists(prisma, "Session"),
    tableExists(prisma, "VerificationToken"),
    columnExists(prisma, "User", "emailVerified"),
    columnExists(prisma, "User", "image"),
  ]);
  return account && session && token && emailVerified && image;
}

async function isDashboardMigrationApplied(prisma: PrismaClient): Promise<boolean> {
  return columnExists(prisma, "Recipe", "isFavorite");
}

async function isMigrationAlreadyInDb(
  prisma: PrismaClient,
  name: string,
): Promise<boolean> {
  if (name === "20260728220000_add_auth") {
    return isAuthMigrationApplied(prisma);
  }
  if (name === "20260729120000_add_recipe_dashboard_fields") {
    return isDashboardMigrationApplied(prisma);
  }
  return false;
}

async function markMigrationApplied(name: string): Promise<void> {
  const checksum = migrationChecksum(name);
  await withRetry(`resolve ${name}`, async (prisma) => {
    const exists = await prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM "_prisma_migrations"
      WHERE migration_name = ${name} AND rolled_back_at IS NULL
      LIMIT 1
    `;
    if (exists.length > 0) return;

    await prisma.$executeRaw`
      INSERT INTO "_prisma_migrations" (
        id, checksum, finished_at, migration_name,
        logs, rolled_back_at, started_at, applied_steps_count
      ) VALUES (
        ${randomUUID()},
        ${checksum},
        NOW(),
        ${name},
        NULL,
        NULL,
        NOW(),
        1
      )
    `;
  });
  console.log(`  ✓ ${name} (resolve — схема уже соответствует)`);
}

async function applyMigrationFile(name: string): Promise<void> {
  const sqlPath = join(process.cwd(), "prisma", "migrations", name, "migration.sql");
  const sql = readFileSync(sqlPath, "utf8");
  const checksum = migrationChecksum(name);
  const statements = splitSqlStatements(sql);

  console.log(`\n→ ${name} (${statements.length} SQL-блоков)`);

  await withRetry(name, async (prisma) => {
    await prisma.$transaction(
      async (tx) => {
        for (const statement of statements) {
          try {
            await tx.$executeRawUnsafe(`${statement};`);
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            // Пропускаем «уже существует» при повторном применении
            if (/already exists|duplicate column/i.test(message)) {
              console.log(`  ~ пропуск (уже есть): ${statement.slice(0, 60)}…`);
              continue;
            }
            throw error;
          }
        }

        const exists = await tx.$queryRaw<{ id: string }[]>`
          SELECT id FROM "_prisma_migrations"
          WHERE migration_name = ${name} AND rolled_back_at IS NULL
          LIMIT 1
        `;
        if (exists.length === 0) {
          await tx.$executeRaw`
            INSERT INTO "_prisma_migrations" (
              id, checksum, finished_at, migration_name,
              logs, rolled_back_at, started_at, applied_steps_count
            ) VALUES (
              ${randomUUID()},
              ${checksum},
              NOW(),
              ${name},
              NULL,
              NULL,
              NOW(),
              ${statements.length}
            )
          `;
        }
      },
      { maxWait: 15000, timeout: 120000 },
    );
  });

  console.log(`  ✓ ${name}`);
}

async function getAppliedNames(): Promise<Set<string>> {
  const rows = await withRetry("migrate status", (prisma) =>
    prisma.$queryRaw<{ migration_name: string }[]>`
      SELECT migration_name FROM "_prisma_migrations"
      WHERE rolled_back_at IS NULL
      ORDER BY started_at
    `,
  );
  return new Set(rows.map((row) => row.migration_name));
}

async function runStatus(): Promise<void> {
  const rows = await withRetry("migrate status", (prisma) =>
    prisma.$queryRaw<
      { migration_name: string; finished_at: Date | null }[]
    >`
      SELECT migration_name, finished_at
      FROM "_prisma_migrations"
      WHERE rolled_back_at IS NULL
      ORDER BY started_at
    `,
  );

  console.log("Применённые миграции (Neon):");
  for (const row of rows) {
    console.log(`  ${row.migration_name} | ${row.finished_at?.toISOString() ?? "NULL"}`);
  }

  const applied = new Set(rows.map((r) => r.migration_name));
  const pending = listMigrationDirs().filter((name) => !applied.has(name));

  if (pending.length === 0) {
    console.log("\nСхема актуальна — pending-миграций нет.");
  } else {
    console.log("\nОжидают применения:");
    for (const name of pending) {
      console.log(`  ${name}`);
    }
  }
}

async function runDeploy(): Promise<void> {
  const applied = await getAppliedNames();
  const pending = listMigrationDirs().filter((name) => !applied.has(name));

  if (pending.length === 0) {
    console.log("Все миграции уже применены на Neon.");
    return;
  }

  console.log("Pending-миграции:", pending.join(", "));

  for (const name of pending) {
    const already = await withRetry(`check ${name}`, (prisma) =>
      isMigrationAlreadyInDb(prisma, name),
    );

    if (already) {
      await markMigrationApplied(name);
      continue;
    }

    await applyMigrationFile(name);
  }

  console.log("\nmigrate deploy завершён успешно.");
}

function runPrismaCli(args: string[]): boolean {
  const url = directUrl();
  const result = spawnSync("npx", ["prisma", ...args], {
    encoding: "utf8",
    shell: true,
    env: {
      ...process.env,
      DATABASE_URL: url,
      DIRECT_URL: url,
      PRISMA_SCHEMA_DISABLE_ADVISORY_LOCK: "1",
    },
    stdio: "pipe",
  });

  const output = `${result.stdout ?? ""}${result.stderr ?? ""}`;
  if (output.trim()) process.stdout.write(output);
  return result.status === 0;
}

async function main(): Promise<void> {
  const command = process.argv[2] ?? "status";

  if (command === "status") {
    await runStatus();
    return;
  }

  if (command === "deploy") {
    if (runPrismaCli(["migrate", "deploy"])) {
      console.log("\nmigrate deploy (prisma CLI) — OK");
      return;
    }

    console.log("\nPrisma CLI не удался — пошаговое применение с retry...\n");
    await runDeploy();
    return;
  }

  console.error("Использование: tsx scripts/migrate-neon.ts <deploy|status>");
  process.exit(1);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
