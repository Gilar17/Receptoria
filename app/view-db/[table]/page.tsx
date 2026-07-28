import Link from "next/link";
import { notFound } from "next/navigation";
import {
  fetchTableRows,
  getDbTargetLabel,
  isDbTarget,
} from "@/lib/view-db";

export const dynamic = "force-dynamic";

type TablePageProps = {
  params: Promise<{ table: string }>;
  searchParams: Promise<{ target?: string }>;
};

function formatCell(value: unknown): string {
  if (value === null || value === undefined) {
    return "—";
  }

  if (value instanceof Date) {
    return value.toLocaleString("ru-RU");
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}

export default async function ViewDbTablePage({
  params,
  searchParams,
}: TablePageProps) {
  const { table } = await params;
  const query = await searchParams;

  if (!isDbTarget(query.target)) {
    notFound();
  }

  const target = query.target;
  const tableName = decodeURIComponent(table);

  let rows: Record<string, unknown>[] = [];
  let error: string | null = null;

  try {
    rows = await fetchTableRows(target, tableName);
  } catch (caught) {
    error =
      caught instanceof Error ? caught.message : "Не удалось загрузить таблицу";
  }

  const columns =
    rows.length > 0 ? Object.keys(rows[0]) : [];

  return (
    <main className="mx-auto flex min-h-full w-full max-w-5xl flex-col gap-6 px-6 py-12">
      <header className="space-y-2">
        <p className="text-sm text-zinc-500">
          <Link href={`/view-db?target=${target}`} className="underline">
            view-db
          </Link>{" "}
          / {tableName}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
          {tableName}
        </h1>
        <p className="text-zinc-600">{getDbTargetLabel(target)}</p>
      </header>

      {error && (
        <section className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-800">
          {error}
        </section>
      )}

      {!error && rows.length === 0 && (
        <p className="text-zinc-500">Таблица пустая.</p>
      )}

      {!error && rows.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50">
              <tr>
                {columns.map((column) => (
                  <th key={column} className="px-4 py-3 font-medium text-zinc-700">
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={index} className="border-b border-zinc-100 last:border-0">
                  {columns.map((column) => (
                    <td key={column} className="px-4 py-3 align-top text-zinc-900">
                      {formatCell(row[column])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Link
        href={`/view-db?target=${target}`}
        className="text-sm text-zinc-500 underline hover:text-zinc-700"
      >
        Назад к списку таблиц
      </Link>
    </main>
  );
}
