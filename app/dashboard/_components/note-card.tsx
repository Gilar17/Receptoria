"use client";

import { useState } from "react";
import { FileText, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatNoteDate } from "@/lib/notes/helpers";
import type { NoteListItem } from "@/lib/notes/queries";
import { NoteDialog } from "@/app/dashboard/_components/note-dialog";
import { DeleteNoteDialog } from "@/app/dashboard/_components/delete-note-dialog";

type NoteCardProps = {
  note: NoteListItem;
};

const noteActionButtonBase =
  "inline-flex h-8 cursor-pointer items-center justify-center gap-1 rounded-lg border px-2.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

const noteEditButtonClass = cn(
  noteActionButtonBase,
  "border-slate-300 bg-white text-slate-700 hover:bg-slate-50 focus-visible:ring-slate-400",
);

const noteDeleteButtonClass = cn(
  noteActionButtonBase,
  "border-[#D4130F] bg-[#D4130F] text-white hover:border-[#b8100d] hover:bg-[#b8100d] focus-visible:ring-[#D4130F]",
);

export function NoteCard({ note }: NoteCardProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <>
      <article className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex min-w-0 items-start gap-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-700">
            <FileText className="h-4 w-4" />
          </div>
          <p className="line-clamp-4 flex-1 text-sm leading-relaxed text-slate-800">
            {note.content}
          </p>
        </div>

        <p className="mt-3 text-xs text-slate-400">
          {formatNoteDate(note.createdAt)}
        </p>

        <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
          <button
            type="button"
            className={noteEditButtonClass}
            onClick={() => setEditOpen(true)}
            aria-label="Редактировать заметку"
          >
            <Pencil className="h-3.5 w-3.5 shrink-0" />
            Правка
          </button>
          <button
            type="button"
            className={noteDeleteButtonClass}
            onClick={() => setDeleteOpen(true)}
            aria-label="Удалить заметку"
          >
            <Trash2 className="h-3.5 w-3.5 shrink-0" />
            Удалить
          </button>
        </div>
      </article>

      <NoteDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        mode="edit"
        note={note}
      />
      <DeleteNoteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        noteId={note.id}
      />
    </>
  );
}
