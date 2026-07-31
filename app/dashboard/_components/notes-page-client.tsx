"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashboardMobileMenu } from "@/app/dashboard/_components/dashboard-mobile-menu";
import { EmptyState } from "@/app/dashboard/_components/empty-state";
import { NoteCard } from "@/app/dashboard/_components/note-card";
import { NoteDialog } from "@/app/dashboard/_components/note-dialog";
import type { NoteListItem } from "@/lib/notes/queries";

type NotesPageClientProps = {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  notes: NoteListItem[];
};

export function NotesPageClient({ user, notes }: NotesPageClientProps) {
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <>
      <header className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <DashboardMobileMenu user={user} />
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Заметки
          </h1>
        </div>
        <Button
          type="button"
          className="w-full sm:w-auto"
          onClick={() => setCreateOpen(true)}
        >
          <Plus className="h-4 w-4" />
          Создать заметку
        </Button>
      </header>

      {notes.length === 0 ? (
        <EmptyState
          title="У вас пока нет заметок"
          description="Создайте первую заметку, чтобы сохранить важную информацию"
          action={
            <Button type="button" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" />
              Создать заметку
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {notes.map((note) => (
            <NoteCard key={note.id} note={note} />
          ))}
        </div>
      )}

      <NoteDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        mode="create"
      />
    </>
  );
}
