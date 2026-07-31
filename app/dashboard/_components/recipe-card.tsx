"use client";

import { useOptimistic, useState, useTransition } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { usePathname, useRouter } from "next/navigation";
import {
  BookOpenText,
  Eye,
  Pencil,
  Star,
  Tag,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { LikeButton } from "@/components/recipes/LikeButton";
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
  showLikes?: boolean;
  categories: CategoryOption[];
};

type OptimisticRecipe = RecipeListItem & {
  pendingFavorite?: boolean;
};

const recipeActionButtonBase =
  "inline-flex h-8 cursor-pointer items-center justify-center gap-1 rounded-lg border px-2 text-[11px] font-medium text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 sm:px-2.5 sm:text-xs";

const recipeOpenButtonClass = cn(
  recipeActionButtonBase,
  "border-[#0E6B59] bg-[#0E6B59] hover:border-[#0c5a4a] hover:bg-[#0c5a4a] hover:text-white focus-visible:ring-[#0E6B59]",
);

const recipeOpenButtonCompactClass = cn(
  recipeOpenButtonClass,
  "w-auto max-w-[33%] shrink-0 flex-none",
);

const recipeEditButtonClass = cn(
  recipeActionButtonBase,
  "min-w-0 flex-1 border-[#084991] bg-[#084991] hover:border-[#063a73] hover:bg-[#063a73] hover:text-white focus-visible:ring-[#084991]",
);

const recipeDeleteButtonClass = cn(
  recipeActionButtonBase,
  "min-w-0 flex-1 border-[#D4130F] bg-[#D4130F] hover:border-[#b8100d] hover:bg-[#b8100d] hover:text-white focus-visible:ring-[#D4130F]",
);

export function RecipeCard({
  recipe,
  currentUserId,
  showAuthor = false,
  showLikes = false,
  categories,
}: RecipeCardProps) {
  const router = useRouter();
  const pathname = usePathname();
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
  const showFavoriteStar = Boolean(currentUserId) && (isOwner || showLikes);

  const handleToggleFavorite = () => {
    if (!currentUserId) {
      toast.error("Чтобы добавить рецепт в избранное, войдите в аккаунт");
      router.push(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
      return;
    }

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
            {showFavoriteStar ? (
              <button
                type="button"
                onClick={handleToggleFavorite}
                disabled={isPending}
                className="rounded-md p-1 text-slate-400 transition hover:text-amber-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 disabled:opacity-50"
                aria-label={
                  optimisticRecipe.isFavorite
                    ? "Удалить рецепт из избранного"
                    : "Добавить рецепт в избранное"
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
          {showLikes && isOwner ? (
            <LikeButton
              recipeId={recipe.id}
              initialLiked={recipe.likedByMe ?? false}
              initialCount={recipe.likesCount ?? 0}
            />
          ) : null}
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

        {!isOwner && showLikes ? (
          <div className="mt-3 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
            <button
              type="button"
              className={recipeOpenButtonCompactClass}
              onClick={() => setViewOpen(true)}
            >
              <Eye className="h-3.5 w-3.5 shrink-0" />
              Открыть
            </button>
            <LikeButton
              recipeId={recipe.id}
              initialLiked={recipe.likedByMe ?? false}
              initialCount={recipe.likesCount ?? 0}
            />
          </div>
        ) : (
          <div className="mt-3 flex flex-nowrap items-center gap-2 border-t border-slate-100 pt-3">
            <button
              type="button"
              className={isOwner ? recipeOpenButtonClass : recipeOpenButtonCompactClass}
              onClick={() => setViewOpen(true)}
            >
              <Eye className="h-3.5 w-3.5 shrink-0" />
              Открыть
            </button>

            {isOwner ? (
              <>
                <button
                  type="button"
                  className={recipeEditButtonClass}
                  onClick={() => setEditOpen(true)}
                >
                  <Pencil className="h-3.5 w-3.5 shrink-0" />
                  Изменить
                </button>
                <button
                  type="button"
                  className={recipeDeleteButtonClass}
                  onClick={() => setDeleteOpen(true)}
                >
                  <Trash2 className="h-3.5 w-3.5 shrink-0" />
                  Удалить
                </button>
              </>
            ) : null}
          </div>
        )}
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
