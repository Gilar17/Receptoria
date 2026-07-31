"use client";

import { useEffect } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createCategory } from "@/lib/recipes/actions";
import {
  categoryFormSchema,
  type CategoryFormValues,
} from "@/lib/recipes/schema";
import { sortCategoryOptions } from "@/lib/recipes/category-helpers";
import type { CategoryOption } from "@/lib/recipes/queries";

type AddCategoryDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCategoryAdded: (category: CategoryOption) => void;
};

export function AddCategoryDialog({
  open,
  onOpenChange,
  onCategoryAdded,
}: AddCategoryDialogProps) {
  const router = useRouter();

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: { category: "" },
  });

  useEffect(() => {
    if (open) {
      form.reset({ category: "" });
    }
  }, [open, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    const result = await createCategory(values);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    const category: CategoryOption = {
      id: result.data!.id,
      category: result.data!.category,
    };

    onCategoryAdded(category);
    onOpenChange(false);
    router.refresh();

    if (result.data!.alreadyExists) {
      toast.message(result.message ?? "Такая категория уже существует");
    } else {
      toast.success(result.message ?? "Категория добавлена");
    }
  });

  const submitting = form.formState.isSubmitting;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Новая категория</DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-category-name">Название категории</Label>
            <Input
              id="new-category-name"
              placeholder="Например, Салаты"
              {...form.register("category")}
              disabled={submitting}
            />
            {form.formState.errors.category ? (
              <p className="text-sm text-red-600">
                {form.formState.errors.category.message}
              </p>
            ) : null}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Отмена
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Добавление..." : "Добавить"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function mergeCategoryOptions(
  current: CategoryOption[],
  added: CategoryOption,
): CategoryOption[] {
  const exists = current.some((item) => item.id === added.id);
  const next = exists
    ? current.map((item) => (item.id === added.id ? added : item))
    : [...current, added];

  return sortCategoryOptions(next);
}
