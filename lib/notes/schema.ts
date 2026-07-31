import { z } from "zod";

export const noteContentSchema = z
  .string()
  .trim()
  .min(1, "Введите текст заметки")
  .max(5000, "Текст заметки слишком длинный");

export const noteFormSchema = z.object({
  content: noteContentSchema,
});

export const updateNoteSchema = noteFormSchema.extend({
  id: z.string().min(1),
});

export const deleteNoteSchema = z.object({
  id: z.string().min(1),
});

export type NoteFormValues = z.infer<typeof noteFormSchema>;
