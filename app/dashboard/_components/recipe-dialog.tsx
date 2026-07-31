"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AddCategoryDialog,
  mergeCategoryOptions,
} from "@/app/dashboard/_components/add-category-dialog";
import { createRecipe, updateRecipe } from "@/lib/recipes/actions";
import { DEFAULT_CATEGORY_NAME } from "@/lib/recipes/constants";
import {
  recipeFormSchema,
  type RecipeFormValues,
} from "@/lib/recipes/schema";
import { isPublicVisibility } from "@/lib/recipes/helpers";
import { sortCategoryOptions } from "@/lib/recipes/category-helpers";
import type { CategoryOption, RecipeListItem } from "@/lib/recipes/queries";

type RecipeDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  recipe?: RecipeListItem;
  categories: CategoryOption[];
};

export function RecipeDialog({
  open,
  onOpenChange,
  mode,
  recipe,
  categories: initialCategories,
}: RecipeDialogProps) {
  const router = useRouter();
  const [extraCategories, setExtraCategories] = useState<CategoryOption[]>([]);
  const [addCategoryOpen, setAddCategoryOpen] = useState(false);

  const categories = useMemo(() => {
    const byId = new Map<string, CategoryOption>();
    for (const item of initialCategories) {
      byId.set(item.id, item);
    }
    for (const item of extraCategories) {
      byId.set(item.id, item);
    }
    return sortCategoryOptions([...byId.values()]);
  }, [initialCategories, extraCategories]);

  const defaultCategoryId = useMemo(() => {
    return (
      categories.find((item) =>
        item.category.toLowerCase() === DEFAULT_CATEGORY_NAME.toLowerCase(),
      )?.id ??
      categories[0]?.id ??
      ""
    );
  }, [categories]);

  const form = useForm<RecipeFormValues>({
    resolver: zodResolver(recipeFormSchema),
    defaultValues: {
      title: "",
      content: "",
      isPublic: false,
      categoryId: defaultCategoryId,
    },
  });

  useEffect(() => {
    if (!open) return;

    form.reset({
      title: mode === "edit" && recipe ? recipe.title : "",
      content: mode === "edit" && recipe ? recipe.content : "",
      isPublic:
        mode === "edit" && recipe
          ? isPublicVisibility(recipe.visibility)
          : false,
      categoryId:
        mode === "edit" && recipe ? recipe.categoryId : defaultCategoryId,
    });
  }, [open, mode, recipe, form, defaultCategoryId]);

  const handleCategoryAdded = (category: CategoryOption) => {
    setExtraCategories((current) => mergeCategoryOptions(current, category));
    form.setValue("categoryId", category.id, { shouldValidate: true });
  };

  const onSubmit = form.handleSubmit(async (values) => {
    const result =
      mode === "create"
        ? await createRecipe(values)
        : await updateRecipe({ id: recipe!.id, ...values });

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success(result.message ?? "Готово");
    onOpenChange(false);
    router.refresh();
  });

  const submitting = form.formState.isSubmitting;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {mode === "create" ? "Новый рецепт" : "Редактирование рецепта"}
            </DialogTitle>
            <DialogDescription>
              {mode === "create"
                ? "Добавьте название и описание рецепта"
                : "Измените данные рецепта и сохраните результат"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Название рецепта</Label>
              <Input id="title" {...form.register("title")} disabled={submitting} />
              {form.formState.errors.title ? (
                <p className="text-sm text-red-600">
                  {form.formState.errors.title.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Текст рецепта</Label>
              <Textarea
                id="content"
                {...form.register("content")}
                disabled={submitting}
              />
              {form.formState.errors.content ? (
                <p className="text-sm text-red-600">
                  {form.formState.errors.content.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoryId">Категория</Label>
              <div className="flex items-start gap-2">
                <Controller
                  name="categoryId"
                  control={form.control}
                  render={({ field }) => (
                    <Select
                      value={field.value ?? defaultCategoryId}
                      onValueChange={field.onChange}
                      disabled={submitting || categories.length === 0}
                    >
                      <SelectTrigger id="categoryId" className="min-w-0 flex-1">
                        <SelectValue placeholder="Выберите категорию" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="shrink-0 gap-1.5"
                  onClick={() => setAddCategoryOpen(true)}
                  disabled={submitting}
                >
                  <Plus className="h-4 w-4" />
                  Добавить категорию
                </Button>
              </div>
            </div>

            <div className="flex items-start justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div>
                <Label htmlFor="isPublic">Публичный рецепт</Label>
                <p className="mt-1 text-xs text-slate-500">
                  Публичный рецепт будет доступен другим пользователям Receptoria
                </p>
              </div>
              <Controller
                name="isPublic"
                control={form.control}
                render={({ field }) => (
                  <Switch
                    id="isPublic"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={submitting}
                  />
                )}
              />
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
                {submitting
                  ? "Сохранение..."
                  : mode === "create"
                    ? "Создать"
                    : "Сохранить"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AddCategoryDialog
        open={addCategoryOpen}
        onOpenChange={setAddCategoryOpen}
        onCategoryAdded={handleCategoryAdded}
      />
    </>
  );
}
