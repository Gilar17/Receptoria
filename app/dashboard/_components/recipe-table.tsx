"use client";

import { useOptimistic, useState, useTransition } from "react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { LikeButton } from "@/components/recipes/LikeButton";
import { DeleteRecipeDialog } from "@/app/dashboard/_components/delete-recipe-dialog";
import { RecipeDialog } from "@/app/dashboard/_components/recipe-dialog";
import { RecipePublicToggle } from "@/app/dashboard/_components/recipe-public-toggle";
import { RecipeViewDialog } from "@/app/dashboard/_components/recipe-view-dialog";
import { toggleRecipeFavorite } from "@/lib/recipes/actions";
import { formatRecipeDate } from "@/lib/recipes/helpers";
import type { CategoryOption, RecipeListItem } from "@/lib/recipes/queries";

type RecipeTableProps = {
  recipes: RecipeListItem[];
  currentUserId: string | null;
  showAuthor?: boolean;
  showLikes?: boolean;
  categories: CategoryOption[];
};

function RecipeTableRow({
  recipe,
  currentUserId,
  showAuthor,
  showLikes,
  categories,
}: {
  recipe: RecipeListItem;
  currentUserId: string | null;
  showAuthor?: boolean;
  showLikes?: boolean;
  categories: CategoryOption[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [optimisticRecipe, setOptimisticRecipe] = useOptimistic(
    recipe,
    (state, update: Partial<RecipeListItem>) => ({ ...state, ...update }),
  );

  const [viewOpen, setViewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const isOwner = currentUserId === recipe.ownerId;
  const categoryName = optimisticRecipe.category?.category ?? "Без категории";
  const showFavoriteStar = Boolean(currentUserId) && (isOwner || showLikes);
  const preview =
    optimisticRecipe.content.length > 80
      ? `${optimisticRecipe.content.slice(0, 80).trim()}…`
      : optimisticRecipe.content;

  const handleToggleFavorite = () => {
    if (!currentUserId) {
      toast.error("Чтобы добавить рецепт в избранное, войдите в аккаунт");
      router.push(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
      return;
    }

    const previous = optimisticRecipe.isFavorite;
    startTransition(async () => {
      setOptimisticRecipe({ isFavorite: !previous });
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
      <TableRow>
        <TableCell className="w-10">
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
        </TableCell>
        <TableCell className="min-w-[160px] font-medium">
          <div className="flex items-center gap-2">
            <BookOpenText className="h-4 w-4 shrink-0 text-sky-600" />
            <span className="line-clamp-2">{optimisticRecipe.title}</span>
          </div>
        </TableCell>
        <TableCell className="min-w-[180px] text-sm text-slate-500">
          {preview}
        </TableCell>
        <TableCell>
          <Badge variant="secondary" className="gap-1 font-normal">
            <Tag className="h-3 w-3" />
            {categoryName}
          </Badge>
        </TableCell>
        <TableCell className="whitespace-nowrap text-xs text-slate-500">
          {formatRecipeDate(optimisticRecipe.updatedAt)}
        </TableCell>
        <TableCell>
          <RecipePublicToggle
            recipeId={recipe.id}
            visibility={optimisticRecipe.visibility}
            isOwner={isOwner}
          />
        </TableCell>
        {showLikes ? (
          <TableCell>
            <LikeButton
              recipeId={recipe.id}
              initialLiked={recipe.likedByMe ?? false}
              initialCount={recipe.likesCount ?? 0}
            />
          </TableCell>
        ) : null}
        <TableCell>
          <div className="flex flex-wrap items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  aria-label="Открыть"
                  onClick={() => setViewOpen(true)}
                >
                  <Eye className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">Открыть</TooltipContent>
            </Tooltip>
            {isOwner ? (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      aria-label="Изменить"
                      onClick={() => setEditOpen(true)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">Изменить</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      aria-label="Удалить"
                      onClick={() => setDeleteOpen(true)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">Удалить</TooltipContent>
                </Tooltip>
              </>
            ) : null}
          </div>
        </TableCell>
      </TableRow>

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

export function RecipeTable({
  recipes,
  currentUserId,
  showAuthor = false,
  showLikes = false,
  categories,
}: RecipeTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10" />
            <TableHead>Название</TableHead>
            <TableHead>Описание</TableHead>
            <TableHead>Категория</TableHead>
            <TableHead>Обновлено</TableHead>
            <TableHead className="w-12">Доступ</TableHead>
            {showLikes ? <TableHead className="w-24">Лайки</TableHead> : null}
            <TableHead>Действия</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {recipes.map((recipe) => (
            <RecipeTableRow
              key={recipe.id}
              recipe={recipe}
              currentUserId={currentUserId}
              showAuthor={showAuthor}
              showLikes={showLikes}
              categories={categories}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
