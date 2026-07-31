import { requireAuth } from "@/lib/auth";
import { getNotesForUser } from "@/lib/notes/queries";
import { NotesPageClient } from "@/app/dashboard/_components/notes-page-client";
import { EmptyState } from "@/app/dashboard/_components/empty-state";

export const dynamic = "force-dynamic";

export default async function NotesPage() {
  const session = await requireAuth();

  try {
    const notes = await getNotesForUser(session.user.id);
    return <NotesPageClient user={session.user} notes={notes} />;
  } catch (error) {
    console.error("notes.load:", error);
    return (
      <EmptyState
        title="Не удалось загрузить заметки"
        description="Проблема с подключением к базе данных. Обновите страницу через минуту."
      />
    );
  }
}
