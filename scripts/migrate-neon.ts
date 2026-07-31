/**
 * Управление миграциями Prisma для Neon.
 *
 * - Только официальный Prisma CLI (migrate status / deploy / resolve).
 * - DIRECT_URL — direct endpoint без pooler.
 * - Retry только для P1017/P1001 (макс. 3 попытки).
 * - Без самописного SQL, без manual INSERT в _prisma_migrations.
 */
import { config } from "dotenv";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { PrismaClient } from "@prisma/client";

config();

const MAX_CLI_RETRIES = 3;
const RETRYABLE = /P1001|P1002|P1017|closed the connection|timed out/i;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function directUrl(): string {
  const raw = process.env.DIRECT_URL;
  if (!raw) {
    throw new Error(
      "DIRECT_URL не задан. Укажите direct connection string Neon (без -pooler).",
    );
  }

  const url = new URL(raw.trim());
  if (url.hostname.includes("-pooler") || url.searchParams.has("pgbouncer")) {
    throw new Error(
      "DIRECT_URL указывает на pooler. Используйте direct endpoint Neon.",
    );
  }

  url.searchParams.delete("channel_binding");
  if (!url.searchParams.has("sslmode")) {
    url.searchParams.set("sslmode", "require");
  }
  url.searchParams.set("connect_timeout", "120");
  return url.toString();
}

function migrationEnv() {
  const url = directUrl();
  return {
    ...process.env,
    DATABASE_URL: url,
    DIRECT_URL: url,
    PRISMA_SCHEMA_DISABLE_ADVISORY_LOCK: "1",
  };
}

function listMigrationDirs(): string[] {
  const dir = join(process.cwd(), "prisma", "migrations");
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

function runPrismaCli(args: string[]): { ok: boolean; output: string; code: number | null } {
  const result = spawnSync("npx", ["prisma", ...args], {
    encoding: "utf8",
    shell: true,
    env: migrationEnv(),
    stdio: "pipe",
  });

  const output = `${result.stdout ?? ""}${result.stderr ?? ""}`;
  if (output.trim()) process.stdout.write(output);
  return { ok: result.status === 0, output, code: result.status };
}

async function runPrismaCliWithRetry(
  args: string[],
  label: string,
): Promise<{ ok: boolean; output: string }> {
  let lastOutput = "";

  for (let attempt = 1; attempt <= MAX_CLI_RETRIES; attempt += 1) {
    const result = runPrismaCli(args);
    lastOutput = result.output;

    if (result.ok || /already recorded as applied|P3008/i.test(result.output)) {
      return { ok: true, output: result.output };
    }

    if (RETRYABLE.test(result.output) && attempt < MAX_CLI_RETRIES) {
      console.log(`${label}: P1017/connection — повтор ${attempt}/${MAX_CLI_RETRIES}`);
      await sleep(3000 * attempt);
      continue;
    }

    return { ok: false, output: result.output };
  }

  return { ok: false, output: lastOutput };
}

function createClient(): PrismaClient {
  return new PrismaClient({
    datasources: { db: { url: directUrl() } },
  });
}

type SchemaIssue = { ok: true } | { ok: false; issues: string[] };

async function tableExists(prisma: PrismaClient, table: string): Promise<boolean> {
  const rows = await prisma.$queryRaw<{ exists: boolean }[]>`
    SELECT EXISTS (
      SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = ${table}
    ) AS exists
  `;
  return Boolean(rows[0]?.exists);
}

async function columnInfo(
  prisma: PrismaClient,
  table: string,
  column: string,
): Promise<{ exists: boolean; dataType: string | null; isNullable: string | null }> {
  const rows = await prisma.$queryRaw<
    { data_type: string | null; is_nullable: string | null }[]
  >`
    SELECT data_type, is_nullable
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = ${table} AND column_name = ${column}
  `;
  if (rows.length === 0) return { exists: false, dataType: null, isNullable: null };
  return {
    exists: true,
    dataType: rows[0]?.data_type ?? null,
    isNullable: rows[0]?.is_nullable ?? null,
  };
}

async function indexExists(prisma: PrismaClient, indexName: string): Promise<boolean> {
  const rows = await prisma.$queryRaw<{ exists: boolean }[]>`
    SELECT EXISTS (
      SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = ${indexName}
    ) AS exists
  `;
  return Boolean(rows[0]?.exists);
}

async function primaryKeyOnColumn(
  prisma: PrismaClient,
  table: string,
  column: string,
): Promise<boolean> {
  const rows = await prisma.$queryRaw<{ exists: boolean }[]>`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
       AND tc.table_schema = kcu.table_schema
      WHERE tc.table_schema = 'public'
        AND tc.table_name = ${table}
        AND tc.constraint_type = 'PRIMARY KEY'
        AND kcu.column_name = ${column}
    ) AS exists
  `;
  return Boolean(rows[0]?.exists);
}

async function foreignKeyExists(
  prisma: PrismaClient,
  table: string,
  constraintName: string,
  column: string,
  refTable: string,
  onDelete: string,
): Promise<boolean> {
  const rows = await prisma.$queryRaw<
    { delete_rule: string | null }[]
  >`
    SELECT rc.delete_rule
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
     AND tc.table_schema = kcu.table_schema
    JOIN information_schema.referential_constraints rc
      ON tc.constraint_name = rc.constraint_name
     AND tc.table_schema = rc.constraint_schema
    JOIN information_schema.constraint_column_usage ccu
      ON rc.unique_constraint_name = ccu.constraint_name
     AND rc.unique_constraint_schema = ccu.constraint_schema
    WHERE tc.table_schema = 'public'
      AND tc.table_name = ${table}
      AND tc.constraint_type = 'FOREIGN KEY'
      AND tc.constraint_name = ${constraintName}
      AND kcu.column_name = ${column}
      AND ccu.table_name = ${refTable}
  `;
  return rows.length > 0 && rows[0]?.delete_rule?.toUpperCase() === onDelete.toUpperCase();
}

async function verifyLikeTable(
  prisma: PrismaClient,
  table: "RecipeLike" | "RecipeFavorite",
): Promise<SchemaIssue> {
  const issues: string[] = [];
  const prefix = table;

  if (!(await tableExists(prisma, table))) {
    return { ok: false, issues: [`Таблица ${table} отсутствует`] };
  }

  const columns: Array<[string, string, string]> = [
    ["id", "text", "NO"],
    ["userId", "text", "NO"],
    ["recipeId", "text", "NO"],
    ["createdAt", "timestamp without time zone", "NO"],
  ];

  for (const [col, type, nullable] of columns) {
    const info = await columnInfo(prisma, table, col);
    if (!info.exists) issues.push(`Колонка ${table}.${col} отсутствует`);
    else {
      if (info.dataType !== type) {
        issues.push(`${table}.${col}: тип ${info.dataType}, ожидается ${type}`);
      }
      if (info.isNullable !== nullable) {
        issues.push(`${table}.${col}: nullable=${info.isNullable}, ожидается ${nullable}`);
      }
    }
  }

  if (!(await primaryKeyOnColumn(prisma, table, "id"))) {
    issues.push(`PRIMARY KEY на ${table}.id отсутствует`);
  }

  for (const idx of [
    `${prefix}_recipeId_idx`,
    `${prefix}_userId_idx`,
    `${prefix}_userId_recipeId_key`,
  ]) {
    if (!(await indexExists(prisma, idx))) {
      issues.push(`Индекс ${idx} отсутствует`);
    }
  }

  if (
    !(await foreignKeyExists(
      prisma,
      table,
      `${prefix}_userId_fkey`,
      "userId",
      "User",
      "CASCADE",
    ))
  ) {
    issues.push(`FK ${prefix}_userId_fkey → User(id) ON DELETE CASCADE отсутствует`);
  }

  if (
    !(await foreignKeyExists(
      prisma,
      table,
      `${prefix}_recipeId_fkey`,
      "recipeId",
      "Recipe",
      "CASCADE",
    ))
  ) {
    issues.push(`FK ${prefix}_recipeId_fkey → Recipe(id) ON DELETE CASCADE отсутствует`);
  }

  return issues.length === 0 ? { ok: true } : { ok: false, issues };
}

async function verifyNotesMigration(prisma: PrismaClient): Promise<SchemaIssue> {
  const issues: string[] = [];

  if (!(await tableExists(prisma, "Note"))) {
    return { ok: false, issues: ["Таблица Note отсутствует"] };
  }

  const content = await columnInfo(prisma, "Note", "content");
  const title = await columnInfo(prisma, "Note", "title");
  const updatedAt = await columnInfo(prisma, "Note", "updatedAt");

  if (content.exists && !title.exists && updatedAt.exists) {
    if (!(await indexExists(prisma, "Note_ownerId_idx"))) {
      issues.push("Индекс Note_ownerId_idx отсутствует");
    }
    if (!(await indexExists(prisma, "Note_createdAt_idx"))) {
      issues.push("Индекс Note_createdAt_idx отсутствует");
    }
    return issues.length === 0 ? { ok: true } : { ok: false, issues };
  }

  if (title.exists && !content.exists) {
    return {
      ok: false,
      issues: ["Note.title ещё есть, Note.content отсутствует — нужен migrate deploy"],
    };
  }

  if (title.exists && content.exists) {
    issues.push("Note.title и Note.content существуют одновременно — требуется ручная проверка");
  }

  if (!updatedAt.exists) {
    issues.push("Note.updatedAt отсутствует");
  }

  return issues.length === 0 ? { ok: true } : { ok: false, issues };
}

async function verifyMigrationSchema(
  prisma: PrismaClient,
  name: string,
): Promise<SchemaIssue> {
  switch (name) {
    case "20260731143000_add_recipe_likes":
      return verifyLikeTable(prisma, "RecipeLike");
    case "20260731160000_add_recipe_favorites":
      return verifyLikeTable(prisma, "RecipeFavorite");
    case "20260731180000_update_notes_content":
      return verifyNotesMigration(prisma);
    default:
      return { ok: false, issues: [`Нет программной проверки для ${name}`] };
  }
}

async function openConnection(): Promise<PrismaClient> {
  for (let attempt = 1; attempt <= MAX_CLI_RETRIES; attempt += 1) {
    const prisma = createClient();
    try {
      await prisma.$connect();
      await prisma.$queryRaw`SELECT 1 AS ok`;
      return prisma;
    } catch (error) {
      await prisma.$disconnect().catch(() => undefined);
      if (attempt < MAX_CLI_RETRIES) {
        console.log(`Подключение: повтор ${attempt}/${MAX_CLI_RETRIES} (P1017/cold start)`);
        await sleep(5000 * attempt);
        continue;
      }
      throw error;
    }
  }
  throw new Error("Не удалось подключиться к Neon");
}

async function ensureConnection(): Promise<PrismaClient> {
  return openConnection();
}

async function runStatus(): Promise<void> {
  const url = new URL(directUrl());
  const dirs = listMigrationDirs();

  console.log("=== Папки prisma/migrations ===");
  console.log(`Всего каталогов: ${dirs.length}`);
  for (const name of dirs) {
    const sqlPath = join(process.cwd(), "prisma", "migrations", name, "migration.sql");
    const hasSql = readFileSync(sqlPath, "utf8").length > 0;
    console.log(`  ${hasSql ? "✓" : "✗"} ${name}`);
  }

  console.log("\n=== Подключение ===");
  console.log(`  host: ${url.hostname}`);
  console.log(`  pooler: ${url.hostname.includes("-pooler")}`);
  console.log(`  sslmode: ${url.searchParams.get("sslmode") ?? "(default)"}`);

  console.log("\n=== prisma migrate status ===");
  const status = await runPrismaCliWithRetry(["migrate", "status"], "migrate status");
  if (!status.ok) {
    console.warn("\nprisma migrate status (CLI) недоступен — читаю _prisma_migrations напрямую.");
  }

  try {
    const prisma = await ensureConnection();
    try {
      const rows = await prisma.$queryRaw<
        { migration_name: string; finished_at: Date | null; rolled_back_at: Date | null }[]
      >`
        SELECT migration_name, finished_at, rolled_back_at
        FROM "_prisma_migrations"
        ORDER BY started_at
      `;

      const applied = new Set(
        rows.filter((r) => r.finished_at && !r.rolled_back_at).map((r) => r.migration_name),
      );
      const pending = dirs.filter((n) => !applied.has(n));

      console.log("\n=== Pending + проверка схемы ===");
      for (const name of pending) {
        const check = await verifyMigrationSchema(prisma, name);
        if ("issues" in check && !check.ok) {
          console.log(`  ${name}: нужно применить / несоответствие`);
          for (const issue of check.issues) console.log(`    - ${issue}`);
        } else if (check.ok) {
          console.log(`  ${name}: схема соответствует → migrate resolve --applied`);
        } else {
          console.log(`  ${name}: (нет проверки)`);
        }
      }
    } finally {
      await prisma.$disconnect().catch(() => undefined);
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

async function runResolve(migrationName: string): Promise<void> {
  if (!listMigrationDirs().includes(migrationName)) {
    throw new Error(`Миграция не найдена: ${migrationName}`);
  }

  const prisma = await ensureConnection();
  try {
    console.log(`\n=== Проверка схемы: ${migrationName} ===`);
    const check = await verifyMigrationSchema(prisma, migrationName);

    if (!check.ok) {
      console.error("Схема НЕ соответствует migration.sql:");
      for (const issue of check.issues) console.error(`  - ${issue}`);
      process.exit(1);
    }
  } finally {
    await prisma.$disconnect().catch(() => undefined);
  }

  console.log("Схема полностью соответствует. Выполняю: npx prisma migrate resolve --applied", migrationName);

  const result = await runPrismaCliWithRetry(
    ["migrate", "resolve", "--applied", migrationName],
    `resolve ${migrationName}`,
  );

  if (!result.ok) {
    console.error(`\nmigrate resolve --applied ${migrationName} не удался.`);
    console.error("Manual INSERT в _prisma_migrations НЕ выполнялся.");
    process.exit(1);
  }

  console.log(`\n✓ ${migrationName} отмечена как applied.`);

  console.log("\n=== prisma migrate status (после resolve) ===");
  const status = await runPrismaCliWithRetry(["migrate", "status"], "migrate status");
  if (!status.ok) process.exit(1);
}

async function runDeploy(): Promise<void> {
  await openConnection().then((p) => p.$disconnect());

  console.log("=== prisma migrate deploy (только официальный CLI) ===");
  console.log("Команда: npx prisma migrate deploy");
  console.log("DATABASE_URL/DIRECT_URL → direct endpoint Neon\n");

  const result = await runPrismaCliWithRetry(["migrate", "deploy"], "migrate deploy");

  if (!result.ok) {
    console.error("\nmigrate deploy не удался после retry.");
    console.error("Самописный SQL fallback НЕ использовался.");
    console.error("\nЕсли pending только resolve-миграции (лайки/избранное), сначала:");
    console.error("  npm run db:migrate:resolve -- 20260731143000_add_recipe_likes");
    console.error("  npm run db:migrate:resolve -- 20260731160000_add_recipe_favorites");
    process.exit(1);
  }

  console.log("\n✓ migrate deploy завершён.");

  console.log("\n=== prisma migrate status (после deploy) ===");
  const status = await runPrismaCliWithRetry(["migrate", "status"], "migrate status");
  if (!status.ok) process.exit(1);
}

async function main(): Promise<void> {
  const command = process.argv[2] ?? "status";
  const arg = process.argv[3];

  if (command === "status") {
    await runStatus();
    return;
  }

  if (command === "resolve") {
    if (!arg) {
      console.error("Укажите имя миграции: tsx scripts/migrate-neon.ts resolve <migration_name>");
      process.exit(1);
    }
    await runResolve(arg);
    return;
  }

  if (command === "deploy") {
    await runDeploy();
    return;
  }

  console.error("Использование:");
  console.error("  tsx scripts/migrate-neon.ts status");
  console.error("  tsx scripts/migrate-neon.ts resolve <migration_name>");
  console.error("  tsx scripts/migrate-neon.ts deploy");
  process.exit(1);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
