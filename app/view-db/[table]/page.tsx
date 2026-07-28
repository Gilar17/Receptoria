import Link from "next/link";
import { notFound } from "next/navigation";
import { DeleteRowButton } from "@/app/view-db/_components/delete-row-button";
import { Pagination } from "@/app/view-db/_components/pagination";
import { ViewDbShell } from "@/app/view-db/_components/view-db-shell";
import {
  fetchTablePage,
  formatCell,
  getTableColumns,
  isDbTarget,
  isViewDbTableName,
} from "@/lib/view-db";

export const dynamic = "force-dynamic";

type TablePageProps = {
  params: Promise<{ table: string }>;
  searchParams: Promise<{ target?: string; page?: string }>;
};

export default async function ViewDbTablePage({
  params,
  searchParams,
}: TablePageProps) {
  const { table } = await params;
  const query = await searchParams;

  if (!isDbTarget(query.target)) {
    notFound();
  }

  const tableName = decodeURIComponent(table);

  if (!isViewDbTableName(tableName)) {
    notFound();
  }

  const target = query.target;
  const page = Number(query.page ?? "1");
  const displayColumns = getTableColumns(tableName);

  let result = null;
  let error: string | null = null;

  try {
    result = await fetchTablePage(target, tableName, page);
  } catch (caught) {
    error =
      caught instanceof Error ? caught.message : "Не удалось загрузить таблицу";
  }

  return (
    <ViewDbShell target={target} currentPath={`/view-db/${tableName}`}>
      <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-zinc-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-sm text-zinc-500">
              Таблица: <span className="font-medium text-zinc-900">{tableName}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/view-db?target=${target}`}
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
            >
              ← Назад к списку таблиц
            </Link>
            <Link
              href={`/view-db/${encodeURIComponent(tableName)}/new?target=${target}`}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >
              + Создать
            </Link>
          </div>
        </div>

        {error && (
          <div className="border-b border-red-200 bg-red-50 px-4 py-3 text-red-800">
            {error}
          </div>
        )}

        {!error && result && (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-zinc-200 bg-zinc-50">
                  <tr>
                    {displayColumns.map((column) => (
                      <th
                        key={column.name}
                        className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500"
                      >
                        {column.label}
                      </th>
                    ))}
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Действие
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {result.rows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={displayColumns.length + 1}
                        className="px-4 py-8 text-center text-zinc-500"
                      >
                        Пусто
                      </td>
                    </tr>
                  ) : (
                    result.rows.map((row) => {
                      const rowId = String(row.id ?? "");

                      return (
                        <tr key={rowId} className="border-b border-zinc-100 last:border-0">
                          {displayColumns.map((column) => (
                            <td key={column.name} className="px-4 py-3 align-top text-zinc-900">
                              {formatCell(row[column.name], column)}
                            </td>
                          ))}
                          <td className="px-4 py-3 align-top whitespace-nowrap">
                            <Link
                              href={`/view-db/${encodeURIComponent(tableName)}/${encodeURIComponent(rowId)}/edit?target=${target}&page=${result.page}`}
                              className="mr-3 text-sm text-blue-600 hover:text-blue-700"
                            >
                              Изменить
                            </Link>
                            <DeleteRowButton
                              target={target}
                              table={tableName}
                              id={rowId}
                              page={result.page}
                            />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            <Pagination
              target={target}
              table={tableName}
              page={result.page}
              totalPages={result.totalPages}
              total={result.total}
              pageSize={result.pageSize}
            />
          </>
        )}
      </section>
    </ViewDbShell>
  );
}
