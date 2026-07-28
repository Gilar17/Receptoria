"use client";

import { useOptimistic, useState, useTransition } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  CookingPot,
  Globe,
  Lock,
  Pencil,
  Star,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { DeleteRecipeDialog } from "@/app/dashboard/_components/delete-recipe-dialog";
import { RecipeDialog } from "@/app/dashboard/_components/recipe-dialog";
import {
  toggleRecipeFavorite,
  toggleRecipePublic,
} from "@/lib/recipes/actions";
import { isPublicVisibility } from "@/lib/recipes/helpers";
import type { RecipeListItem } from "@/lib/recipes/queries";

type RecipeCardProps = {
  recipe: RecipeListItem;
  currentUserId: string | null;
  showAuthor?: boolean;
};

type OptimisticRecipe = RecipeListItem & {
  pendingFavorite?: boolean;
  pendingPublic?: boolean;
};

export function RecipeCard({
  recipe,
  currentUserId,
  showAuthor = false,
}: RecipeCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [optimisticRecipe, setOptimisticRecipe] = useOptimistic<
    OptimisticRecipe,
    Partial<OptimisticRecipe>
  >(recipe, (state, update) => ({ ...state, ...update }));

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const isOwner = currentUserId === recipe.ownerId;
  const isPublic = isPublicVisibility(optimisticRecipe.visibility);

  const preview =
    optimisticRecipe.content.length > 160
      ? `${optimisticRecipe.content.slice(0, 160).trim()}…`
      : optimisticRecipe.content;

  const handleToggleFavorite = () => {
    if (!isOwner) return;

    const previous = optimisticRecipe.isFavorite;
    startTransition(async () => {
      setOptimisticRecipe({ isFavorite: !previous, pendingFavorite: true });
      const result = await toggleRecipeFavorite({ id: recipe.id });
      if (!result.success) {
        setOptimisticRecipe({ isFavorite: previous });
        toast.error(result.error);
        return;
      }
      router.refresh();
    });
  };

  const handleTogglePublic = (checked: boolean) => {
    if (!isOwner) return;

    const previous = isPublicVisibility(optimisticRecipe.visibility);
    startTransition(async () => {
      setOptimisticRecipe({
        visibility: checked ? "PUBLIC" : "PRIVATE",
        pendingPublic: true,
      });
      const result = await toggleRecipePublic({ id: recipe.id, isPublic: checked });
      if (!result.success) {
        setOptimisticRecipe({ visibility: previous ? "PUBLIC" : "PRIVATE" });
        toast.error(result.error);
        return;
      }
      router.refresh();
    });
  };

  return (
    <>
      <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
        <div className="flex gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
            <CookingPot className="h-5 w-5" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-base font-semibold text-slate-900">
                  {optimisticRecipe.title}
                </h3>
                <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                  {preview}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {isOwner ? (
                  <button
                    type="button"
                    onClick={handleToggleFavorite}
                    disabled={isPending}
                    className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-50 hover:text-amber-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                    aria-label={
                      optimisticRecipe.isFavorite
                        ? "Убрать из избранного"
                        : "Добавить в избранное"
                    }
                  >
                    <Star
                      className={cn(
                        "h-4 w-4",
                        optimisticRecipe.isFavorite &&
                          "fill-amber-400 text-amber-400",
                      )}
                    />
                  </button>
                ) : null}

                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                  {isPublic ? (
                    <>
                      <Globe className="h-3.5 w-3.5" />
                      Публичный
                    </>
                  ) : (
                    <>
                      <Lock className="h-3.5 w-3.5" />
                      Приватный
                    </>
                  )}
                </span>
              </div>
            </div>

            {showAuthor ? (
              <div className="mt-3 flex items-center gap-2 text-sm text-slate-600">
                {recipe.owner.image ? (
                  <Image
                    src={recipe.owner.image}
                    alt={recipe.owner.name ?? "Автор"}
                    width={24}
                    height={24}
                    className="rounded-full"
                  />
                ) : (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-xs font-medium">
                    {(recipe.owner.name?.[0] ?? "A").toUpperCase()}
                  </div>
                )}
                <span>{recipe.owner.name ?? "Автор"}</span>
              </div>
            ) : null}

            {isOwner ? (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditOpen(true)}
                >
                  <Pencil className="h-4 w-4" />
                  Редактировать
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setDeleteOpen(true)}
                >
                  <Trash2 className="h-4 w-4" />
                  Удалить
                </Button>
                <div className="ml-auto flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5">
                  <span className="text-xs text-slate-600">Публичный</span>
                  <Switch
                    checked={isPublic}
                    onCheckedChange={handleTogglePublic}
                    disabled={isPending}
                    aria-label="Переключить публичность"
                  />
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </article>

      {isOwner ? (
        <>
          <RecipeDialog
            open={editOpen}
            onOpenChange={setEditOpen}
            mode="edit"
            recipe={recipe}
          />
          <DeleteRecipeDialog
            open={deleteOpen}
            onOpenChange={setDeleteOpen}
            recipeId={recipe.id}
            recipeTitle={recipe.title}
          />
        </>
      ) : null}
    </>
  );
}
