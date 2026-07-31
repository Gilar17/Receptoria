"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { createNote, updateNote } from "@/lib/notes/actions";
import { noteFormSchema, type NoteFormValues } from "@/lib/notes/schema";
import type { NoteListItem } from "@/lib/notes/queries";

type NoteDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  note?: NoteListItem;
};

export function NoteDialog({ open, onOpenChange, mode, note }: NoteDialogProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<NoteFormValues>({
    resolver: zodResolver(noteFormSchema),
    defaultValues: { content: "" },
  });

  useEffect(() => {
    if (!open) return;

    form.reset({
      content: mode === "edit" && note ? note.content : "",
    });
  }, [open, mode, note, form]);

  const handleSubmit = form.handleSubmit(async (values) => {
    if (submitting) return;

    setSubmitting(true);
    try {
      const result =
        mode === "create"
          ? await createNote(values)
          : await updateNote({ id: note!.id, ...values });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success(result.message ?? "Заметка сохранена");
      onOpenChange(false);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  });

  const errorMessage = form.formState.errors.content?.message;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Создать заметку" : "Правка заметки"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="note-content">Текст заметки</Label>
            <Textarea
              id="note-content"
              placeholder="Введите текст заметки"
              className="min-h-[160px] resize-y"
              aria-describedby={errorMessage ? "note-content-error" : undefined}
              disabled={submitting}
              autoFocus
              {...form.register("content")}
            />
            {errorMessage ? (
              <p id="note-content-error" className="text-sm text-red-600">
                {errorMessage}
              </p>
            ) : null}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Отмена
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Сохранение..." : "Сохранить"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
