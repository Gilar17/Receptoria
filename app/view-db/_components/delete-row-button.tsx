"use client";

import { deleteRowAction } from "@/app/view-db/actions";

type DeleteRowButtonProps = {
  target: string;
  table: string;
  id: string;
  page: number;
};

export function DeleteRowButton({ target, table, id, page }: DeleteRowButtonProps) {
  return (
    <form action={deleteRowAction} className="inline">
      <input type="hidden" name="target" value={target} />
      <input type="hidden" name="table" value={table} />
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="page" value={String(page)} />
      <button
        type="submit"
        className="text-sm text-red-600 hover:text-red-700"
        onClick={(event) => {
          if (!window.confirm("Удалить запись?")) {
            event.preventDefault();
          }
        }}
      >
        Удалить
      </button>
    </form>
  );
}
