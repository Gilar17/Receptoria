"use client";

import { useOptimistic, useState, useTransition } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  BookOpenText,
  Eye,
  Pencil,
  Star,
  Tag,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CopyRecipeButton } from "@/app/dashboard/_components/copy-recipe-button";
import { DeleteRecipeDialog } from "@/app/dashboard/_components/delete-recipe-dialog";
import { RecipeDialog } from "@/app/dashboard/_components/recipe-dialog";
import { RecipePublicToggle } from "@/app/dashboard/_components/recipe-public-toggle";
import { RecipeViewDialog } from "@/app/dashboard/_components/recipe-view-dialog";
import { toggleRecipeFavorite } from "@/lib/recipes/actions";
import { formatRecipeDate } from "@/lib/recipes/helpers";
import type { CategoryOption, RecipeListItem } from "@/lib/recipes/queries";

type RecipeCardProps = {
  recipe: RecipeListItem;
  currentUserId: string | null;
  showAuthor?: boolean;
  categories: CategoryOption[];
};

type OptimisticRecipe = RecipeListItem & {
  pendingFavorite?: boolean;
};

export function RecipeCard({
  recipe,
  currentUserId,
  showAuthor = false,
  categories,
}: RecipeCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [optimisticRecipe, setOptimisticRecipe] = useOptimistic<
    OptimisticRecipe,
    Partial<OptimisticRecipe>
  >(recipe, (state, update) => ({ ...state, ...update }));

  const [viewOpen, setViewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const isOwner = currentUserId === recipe.ownerId;
  const categoryName = optimisticRecipe.category?.category ?? "Без категории";

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

  return (
    <>
      <article className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-start gap-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-700">
              <BookOpenText className="h-4 w-4" />
            </div>
            <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-slate-900">
              {optimisticRecipe.title}
            </h3>
          </div>
          <div className="flex shrink-0 items-center gap-0.5">
            {isOwner ? (
              <button
                type="button"
                onClick={handleToggleFavorite}
                disabled={isPending}
                className="rounded-md p-1 text-slate-400 transition hover:text-amber-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 disabled:opacity-50"
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
            <RecipePublicToggle
              recipeId={recipe.id}
              visibility={optimisticRecipe.visibility}
              isOwner={isOwner}
            />
          </div>
        </div>

        <p className="mt-2 line-clamp-3 flex-1 text-sm text-slate-500">
          {optimisticRecipe.content}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          <Badge variant="secondary" className="gap-1 font-normal">
            <Tag className="h-3 w-3" />
            {categoryName}
          </Badge>
          <span className="text-slate-400">
            {formatRecipeDate(optimisticRecipe.updatedAt)}
          </span>
          <CopyRecipeButton
            title={optimisticRecipe.title}
            categoryName={categoryName}
            content={optimisticRecipe.content}
          />
        </div>

        {showAuthor ? (
          <div className="mt-2 flex items-center gap-2 text-xs text-slate-600">
            {recipe.owner.image ? (
              <Image
                src={recipe.owner.image}
                alt={recipe.owner.name ?? "Автор"}
                width={20}
                height={20}
                className="rounded-full"
              />
            ) : (
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-[10px] font-medium">
                {(recipe.owner.name?.[0] ?? "A").toUpperCase()}
              </div>
            )}
            <span>{recipe.owner.name ?? "Автор"}</span>
          </div>
        ) : null}

        <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-slate-100 pt-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 px-2.5 text-xs"
            onClick={() => setViewOpen(true)}
          >
            <Eye className="h-3.5 w-3.5" />
            Открыть
          </Button>

          {isOwner ? (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 px-2.5 text-xs"
                onClick={() => setEditOpen(true)}
              >
                <Pencil className="h-3.5 w-3.5" />
                Изменить
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 px-2.5 text-xs"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Удалить
              </Button>
            </>
          ) : null}
        </div>
      </article>

      <RecipeViewDialog
        open={viewOpen}
        onOpenChange={setViewOpen}
        recipe={optimisticRecipe}
        showAuthor={showAuthor}
        onEdit={
          isOwner
            ? () => {
                setViewOpen(false);
                setEditOpen(true);
              }
            : undefined
        }
      />

      {isOwner ? (
        <>
          <RecipeDialog
            open={editOpen}
            onOpenChange={setEditOpen}
            mode="edit"
            recipe={recipe}
            categories={categories}
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
