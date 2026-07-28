"use client";

import { getDbTargetEnvLabel, getDbTargetLabel, type DbTarget } from "@/lib/view-db";

type DbSelectorProps = {
  target: DbTarget;
  currentPath: string;
};

export function DbSelector({ target, currentPath }: DbSelectorProps) {
  return (
    <div className="flex flex-col items-end gap-1">
      <label htmlFor="db-select" className="text-sm text-zinc-500">
        База данных
      </label>
      <select
        id="db-select"
        defaultValue={target}
        className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
        onChange={(event) => {
          const nextTarget = event.target.value;
          window.location.href = `${currentPath}?target=${nextTarget}`;
        }}
      >
        <option value="work">{getDbTargetLabel("work")}</option>
        <option value="local">{getDbTargetLabel("local")}</option>
      </select>
      <span className="text-xs text-zinc-400">{getDbTargetEnvLabel(target)}</span>
    </div>
  );
}

export function ViewDbShell({
  children,
  target,
  currentPath,
}: {
  children: React.ReactNode;
  target?: DbTarget;
  currentPath: string;
}) {
  return (
    <main className="min-h-screen bg-[#f7f4ef] px-4 py-8 text-zinc-900">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">view-db</h1>
              <p className="text-zinc-600">
                Receptoria — просмотр и CRUD для локальной или рабочей БД
              </p>
            </div>
          </div>
          {target && <DbSelector target={target} currentPath={currentPath} />}
        </header>
        {children}
      </div>
    </main>
  );
}
