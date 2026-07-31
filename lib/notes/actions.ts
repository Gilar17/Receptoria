"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getNoteByIdForOwner } from "@/lib/notes/queries";
import {
  deleteNoteSchema,
  noteFormSchema,
  updateNoteSchema,
} from "@/lib/notes/schema";

export type NoteActionResult<T = void> =
  | { success: true; data?: T; message?: string }
  | { success: false; error: string };

const NOTES_PATH = "/dashboard/notes";

async function requireUserId(): Promise<string | NoteActionResult<never>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Необходимо войти в аккаунт" };
  }
  return session.user.id;
}

export async function createNote(
  input: unknown,
): Promise<NoteActionResult<{ id: string }>> {
  const userId = await requireUserId();
  if (typeof userId !== "string") {
    return userId;
  }

  const parsed = noteFormSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Некорректные данные",
    };
  }

  try {
    const note = await prisma.note.create({
      data: {
        content: parsed.data.content,
        ownerId: userId,
      },
    });

    revalidatePath(NOTES_PATH);
    return {
      success: true,
      data: { id: note.id },
      message: "Заметка создана",
    };
  } catch (error) {
    console.error("createNote:", error);
    return {
      success: false,
      error: "Не удалось создать заметку. Попробуйте позже",
    };
  }
}

export async function updateNote(
  input: unknown,
): Promise<NoteActionResult<{ id: string }>> {
  const userId = await requireUserId();
  if (typeof userId !== "string") {
    return userId;
  }

  const parsed = updateNoteSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Некорректные данные",
    };
  }

  const existing = await getNoteByIdForOwner(parsed.data.id, userId);
  if (!existing) {
    return { success: false, error: "Заметка не найдена или доступ запрещён" };
  }

  try {
    const note = await prisma.note.update({
      where: { id: parsed.data.id },
      data: { content: parsed.data.content },
    });

    revalidatePath(NOTES_PATH);
    return {
      success: true,
      data: { id: note.id },
      message: "Заметка сохранена",
    };
  } catch (error) {
    console.error("updateNote:", error);
    return {
      success: false,
      error: "Не удалось сохранить заметку. Попробуйте позже",
    };
  }
}

export async function deleteNote(
  input: unknown,
): Promise<NoteActionResult> {
  const userId = await requireUserId();
  if (typeof userId !== "string") {
    return userId;
  }

  const parsed = deleteNoteSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Некорректные данные",
    };
  }

  const existing = await getNoteByIdForOwner(parsed.data.id, userId);
  if (!existing) {
    return { success: false, error: "Заметка не найдена или доступ запрещён" };
  }

  try {
    await prisma.note.delete({ where: { id: parsed.data.id } });
    revalidatePath(NOTES_PATH);
    return {
      success: true,
      message: "Заметка удалена",
    };
  } catch (error) {
    console.error("deleteNote:", error);
    return {
      success: false,
      error: "Не удалось удалить заметку. Попробуйте позже",
    };
  }
}
