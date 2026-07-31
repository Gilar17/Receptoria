"use client";

import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Globe, Lock, Tag } from "lucide-react";
import { formatRecipeDate, isPublicVisibility } from "@/lib/recipes/helpers";
import type { RecipeListItem } from "@/lib/recipes/queries";

type RecipeViewDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipe: RecipeListItem;
  showAuthor?: boolean;
  onEdit?: () => void;
};

export function RecipeViewDialog({
  open,
  onOpenChange,
  recipe,
  showAuthor = false,
  onEdit,
}: RecipeViewDialogProps) {
  const isPublic = isPublicVisibility(recipe.visibility);
  const categoryName = recipe.category?.category ?? "Без категории";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{recipe.title}</DialogTitle>
          <DialogDescription className="flex flex-wrap items-center gap-2 pt-1">
            <Badge variant="secondary" className="gap-1 font-normal">
              <Tag className="h-3 w-3" />
              {categoryName}
            </Badge>
            <Badge variant="outline" className="gap-1 font-normal">
              {isPublic ? (
                <>
                  <Globe className="h-3 w-3" />
                  Публичный
                </>
              ) : (
                <>
                  <Lock className="h-3 w-3" />
                  Приватный
                </>
              )}
            </Badge>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-sm text-slate-700">
          <div className="whitespace-pre-wrap rounded-xl border border-slate-200 bg-slate-50 p-4 leading-relaxed">
            {recipe.content}
          </div>

          <dl className="grid gap-2 text-xs text-slate-500 sm:grid-cols-2">
            <div>
              <dt className="font-medium text-slate-600">Создан</dt>
              <dd>{formatRecipeDate(recipe.createdAt)}</dd>
            </div>
            <div>
              <dt className="font-medium text-slate-600">Обновлён</dt>
              <dd>{formatRecipeDate(recipe.updatedAt)}</dd>
            </div>
          </dl>

          {showAuthor ? (
            <div className="flex items-center gap-2 border-t border-slate-100 pt-4">
              {recipe.owner.image ? (
                <Image
                  src={recipe.owner.image}
                  alt={recipe.owner.name ?? "Автор"}
                  width={32}
                  height={32}
                  className="rounded-full"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-xs font-medium">
                  {(recipe.owner.name?.[0] ?? "A").toUpperCase()}
                </div>
              )}
              <div>
                <p className="text-xs text-slate-500">Автор</p>
                <p className="text-sm font-medium text-slate-800">
                  {recipe.owner.name ?? "Автор"}
                </p>
              </div>
            </div>
          ) : null}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          {onEdit ? (
            <Button type="button" variant="outline" onClick={onEdit}>
              Изменить
            </Button>
          ) : null}
          <Button type="button" onClick={() => onOpenChange(false)}>
            Закрыть
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
