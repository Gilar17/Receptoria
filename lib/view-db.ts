import { withDb, type DbTarget } from "@/lib/db-client";
import {
  getModelDelegate,
  isViewDbTableName,
  VIEW_DB_TABLES,
  type FieldConfig,
  type ViewDbTableName,
} from "@/lib/view-db-tables";

export type { DbTarget };
export {
  isViewDbTableName,
  VIEW_DB_TABLES,
  type ViewDbTableName,
  type FieldConfig,
};

export const PAGE_SIZE = 10;

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

export function getDbTargetEnvLabel(target: DbTarget): string {
  return target === "work" ? "Neon – DATABASE_URL" : "LOCAL_DATABASE_URL";
}

export type TableInfo = {
  name: ViewDbTableName;
  rowCount: number;
};

export type TablePageResult = {
  rows: Record<string, unknown>[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

function serializeValue(value: unknown): unknown {
  if (value instanceof Date) {
    return value.toISOString();
  }

  return value;
}

export function serializeRow(row: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(row)) {
    result[key] = serializeValue(value);
  }

  return result;
}

export async function listTables(target: DbTarget): Promise<TableInfo[]> {
  return withDb(
    "listTables",
    async (prisma) => {
      const counts = await Promise.all(
        Object.keys(VIEW_DB_TABLES).map(async (name) => {
          const tableName = name as ViewDbTableName;
          const model = getModelDelegate(prisma, tableName);
          const rowCount = await model.count();
          return { name: tableName, rowCount };
        }),
      );

      return counts.sort((a, b) => a.name.localeCompare(b.name));
    },
    { target },
  );
}

export async function fetchTablePage(
  target: DbTarget,
  tableName: ViewDbTableName,
  page = 1,
): Promise<TablePageResult> {
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const config = VIEW_DB_TABLES[tableName];

  return withDb(
    "fetchTablePage",
    async (prisma) => {
      const model = getModelDelegate(prisma, tableName);
      const skip = (safePage - 1) * PAGE_SIZE;

      const [rows, total] = await Promise.all([
        model.findMany({
          skip,
          take: PAGE_SIZE,
          orderBy: config.orderBy,
        }),
        model.count(),
      ]);

      const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

      return {
        rows: rows.map((row) => serializeRow(row)),
        total,
        page: safePage,
        pageSize: PAGE_SIZE,
        totalPages,
      };
    },
    { target },
  );
}

export async function fetchRecord(
  target: DbTarget,
  tableName: ViewDbTableName,
  id: string,
): Promise<Record<string, unknown> | null> {
  return withDb(
    "fetchRecord",
    async (prisma) => {
      const model = getModelDelegate(prisma, tableName);
      const row = await model.findUnique({ where: { id } });
      return row ? serializeRow(row) : null;
    },
    { target },
  );
}

function parseFieldValue(field: FieldConfig, raw: FormDataEntryValue | null): unknown {
  if (raw === null || raw === "") {
    return field.type === "number" ? undefined : null;
  }

  const value = String(raw);

  if (field.type === "number") {
    return Number(value);
  }

  if (field.type === "datetime") {
    return value ? new Date(value) : null;
  }

  return value;
}

function buildDataFromForm(
  tableName: ViewDbTableName,
  formData: FormData,
  mode: "create" | "edit",
): Record<string, unknown> {
  const config = VIEW_DB_TABLES[tableName];
  const data: Record<string, unknown> = {};

  for (const field of config.fields) {
    if (mode === "create" && field.readOnlyOnCreate) {
      continue;
    }

    if (mode === "edit" && field.readOnlyOnEdit) {
      continue;
    }

    const parsed = parseFieldValue(field, formData.get(field.name));

    if (parsed === undefined) {
      continue;
    }

    data[field.name] = parsed;
  }

  return data;
}

export async function createRecord(
  target: DbTarget,
  tableName: ViewDbTableName,
  formData: FormData,
): Promise<Record<string, unknown>> {
  const data = buildDataFromForm(tableName, formData, "create");

  return withDb(
    "createRecord",
    async (prisma) => {
      const model = getModelDelegate(prisma, tableName);
      const row = await model.create({ data });
      return serializeRow(row);
    },
    { target },
  );
}

export async function updateRecord(
  target: DbTarget,
  tableName: ViewDbTableName,
  id: string,
  formData: FormData,
): Promise<Record<string, unknown>> {
  const data = buildDataFromForm(tableName, formData, "edit");

  return withDb(
    "updateRecord",
    async (prisma) => {
      const model = getModelDelegate(prisma, tableName);
      const row = await model.update({ where: { id }, data });
      return serializeRow(row);
    },
    { target },
  );
}

export async function deleteRecord(
  target: DbTarget,
  tableName: ViewDbTableName,
  id: string,
): Promise<void> {
  await withDb(
    "deleteRecord",
    async (prisma) => {
      const model = getModelDelegate(prisma, tableName);
      await model.delete({ where: { id } });
    },
    { target },
  );
}

export function formatCell(value: unknown, field?: FieldConfig): string {
  if (value === null || value === undefined) {
    return "NULL";
  }

  if (field?.displayFormat === "ru-datetime") {
    const date =
      value instanceof Date
        ? value
        : typeof value === "string"
          ? new Date(value)
          : null;

    if (date && !Number.isNaN(date.getTime())) {
      return date.toLocaleString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}

export function getTableColumns(tableName: ViewDbTableName): FieldConfig[] {
  return VIEW_DB_TABLES[tableName].fields;
}
