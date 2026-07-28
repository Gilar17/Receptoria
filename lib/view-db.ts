import { withDb, resolveDatabaseUrl, type DbTarget } from "@/lib/db-client";

export type { DbTarget };

const TARGET_LABELS: Record<DbTarget, string> = {
  local: "Локальная БД",
  work: "Рабочая БД (Neon)",
};

export function getDbTargetLabel(target: DbTarget): string {
  return TARGET_LABELS[target];
}

export function isDbTarget(value: string | undefined): value is DbTarget {
  return value === "local" || value === "work";
}

export type TableInfo = {
  name: string;
  rowCount: number;
};

const TABLE_NAME_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;

export function assertValidTableName(name: string): void {
  if (!TABLE_NAME_PATTERN.test(name)) {
    throw new Error("Недопустимое имя таблицы");
  }
}

export async function listTables(target: DbTarget): Promise<TableInfo[]> {
  return withDb(
    "listTables",
    async (prisma) => {
      const tables = await prisma.$queryRaw<{ table_name: string }[]>`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_type = 'BASE TABLE'
        ORDER BY table_name
      `;

      if (tables.length === 0) {
        return [];
      }

      for (const table of tables) {
        assertValidTableName(table.table_name);
      }

      const union = tables
        .map(
          (table) =>
            `SELECT '${table.table_name.replace(/'/g, "''")}' AS name, COUNT(*)::bigint AS count FROM "${table.table_name}"`,
        )
        .join(" UNION ALL ");

      const counts = await prisma.$queryRawUnsafe<
        { name: string; count: bigint }[]
      >(union);

      return counts.map((row) => ({
        name: row.name,
        rowCount: Number(row.count),
      }));
    },
    { target },
  );
}

export async function fetchTableRows(
  target: DbTarget,
  tableName: string,
  limit = 50,
): Promise<Record<string, unknown>[]> {
  assertValidTableName(tableName);

  return withDb(
    "fetchTableRows",
    async (prisma) => {
      const exists = await prisma.$queryRaw<{ ok: number }[]>`
        SELECT 1 AS ok
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = ${tableName}
        LIMIT 1
      `;

      if (exists.length === 0) {
        throw new Error(`Таблица "${tableName}" не найдена`);
      }

      return prisma.$queryRawUnsafe<Record<string, unknown>[]>(
        `SELECT * FROM "${tableName}" ORDER BY 1 LIMIT ${limit}`,
      );
    },
    { target },
  );
}

export function maskConnectionHost(target: DbTarget): string {
  try {
    return new URL(resolveDatabaseUrl(target)).hostname;
  } catch {
    return "не настроено";
  }
}
