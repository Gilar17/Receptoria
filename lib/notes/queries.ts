import { prisma } from "@/lib/prisma";
import { withDbRetry } from "@/lib/db-client";

export type NoteListItem = {
  id: string;
  content: string;
  createdAt: Date;
  ownerId: string;
};

export async function getNotesForUser(ownerId: string): Promise<NoteListItem[]> {
  return withDbRetry("notes.findMany", () =>
    prisma.note.findMany({
      where: { ownerId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        content: true,
        createdAt: true,
        ownerId: true,
      },
    }),
  );
}

export async function getNoteByIdForOwner(noteId: string, ownerId: string) {
  const note = await withDbRetry("notes.findById", () =>
    prisma.note.findUnique({ where: { id: noteId } }),
  );

  if (!note || note.ownerId !== ownerId) {
    return null;
  }

  return note;
}
