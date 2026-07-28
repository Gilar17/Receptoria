"use client";

import Link from "next/link";
import type { DbTarget } from "@/lib/view-db";

type PaginationProps = {
  target: DbTarget;
  table: string;
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
};

export function Pagination({
  target,
  table,
  page,
  totalPages,
  total,
  pageSize,
}: PaginationProps) {
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const base = `/view-db/${encodeURIComponent(table)}?target=${target}`;

  return (
    <div className="flex flex-col gap-3 border-t border-zinc-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-zinc-500">
        Показано {from} – {to} из {total}
      </p>
      <div className="flex items-center gap-2">
        <Link
          href={`${base}&page=${Math.max(1, page - 1)}`}
          aria-disabled={page <= 1}
          className={`rounded-lg border px-3 py-1.5 text-sm ${
            page <= 1
              ? "pointer-events-none border-zinc-200 text-zinc-300"
              : "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50"
          }`}
        >
          ← Назад
        </Link>
        <span className="text-sm text-zinc-600">
          Страница {page} из {totalPages}
        </span>
        <Link
          href={`${base}&page=${Math.min(totalPages, page + 1)}`}
          aria-disabled={page >= totalPages}
          className={`rounded-lg border px-3 py-1.5 text-sm ${
            page >= totalPages
              ? "pointer-events-none border-zinc-200 text-zinc-300"
              : "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50"
          }`}
        >
          Вперёд →
        </Link>
      </div>
    </div>
  );
}
