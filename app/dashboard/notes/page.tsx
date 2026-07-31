import { requireAuth } from "@/lib/auth";
import { getNotesForUser } from "@/lib/notes/queries";
import { NotesPageClient } from "@/app/dashboard/_components/notes-page-client";

export const dynamic = "force-dynamic";

export default async function NotesPage() {
  const session = await requireAuth();
  const notes = await getNotesForUser(session.user.id);

  return <NotesPageClient user={session.user} notes={notes} />;
}
