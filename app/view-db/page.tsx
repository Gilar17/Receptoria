import Link from "next/link";
import {
  getDbTargetEnvLabel,
  getDbTargetLabel,
  isDbTarget,
  listTables,
  type DbTarget,
} from "@/lib/view-db";

export const dynamic = "force-dynamic";

type ViewDbPageProps = {
  searchParams: Promise<{ target?: string }>;
};

function TargetCard({
  target,
  active,
}: {
  target: DbTarget;
  active: boolean;
}) {
  const label = getDbTargetLabel(target);

  return (
    <Link
      href={`/view-db?target=${target}`}
      className={`rounded-xl border px-5 py-4 transition-colors ${
        active
          ? "border-blue-600 bg-blue-600 text-white"
          : "border-zinc-200 bg-white text-zinc-900 hover:border-zinc-400"
      }`}
    >
      <div className="font-medium">{label}</div>
      <div
        className={`mt-1 text-sm ${active ? "text-blue-100" : "text-zinc-500"}`}
      >
        {getDbTargetEnvLabel(target)}
      </div>
    </Link>
  );
}

export default async function ViewDbPage({ searchParams }: ViewDbPageProps) {
  const params = await searchParams;
  const selectedTarget = isDbTarget(params.target) ? params.target : null;

  let tables = null;
  let error: string | null = null;

  if (selectedTarget) {
    try {
      tables = await listTables(selectedTarget);
    } catch (caught) {
      error =
        caught instanceof Error ? caught.message : "Не удалось подключиться к БД";
    }
  }

  return (
    <main className="mx-auto flex min-h-full w-full max-w-3xl flex-col gap-8 px-6 py-12">
      <header className="space-y-2">
        <p className="text-sm text-zinc-500">view-db</p>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
          Receptoria — просмотр базы данных
        </h1>
        <p className="text-zinc-600">
          Выберите локальную или рабочую БД, затем откройте нужную таблицу.
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-2">
        <TargetCard target="local" active={selectedTarget === "local"} />
        <TargetCard target="work" active={selectedTarget === "work"} />
      </section>

      {selectedTarget && error && (
        <section className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-800">
          {error}
        </section>
      )}

      {selectedTarget && tables && (
        <section className="space-y-3">
          <h2 className="text-lg font-medium text-zinc-900">
            Таблицы — {getDbTargetLabel(selectedTarget)}
          </h2>

          {tables.length === 0 ? (
            <p className="text-zinc-500">Таблицы не найдены.</p>
          ) : (
            <ul className="divide-y divide-zinc-200 overflow-hidden rounded-xl border border-zinc-200 bg-white">
              {tables.map((table) => (
                <li
                  key={table.name}
                  className="flex items-center justify-between gap-4 px-4 py-3"
                >
                  <div>
                    <div className="font-medium text-zinc-900">{table.name}</div>
                    <div className="text-sm text-zinc-500">
                      {table.rowCount} записей
                    </div>
                  </div>
                  <Link
                    href={`/view-db/${encodeURIComponent(table.name)}?target=${selectedTarget}`}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    Открыть
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </main>
  );
}
