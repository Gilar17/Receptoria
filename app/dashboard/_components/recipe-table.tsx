"use client";

import { useOptimistic, useState, useTransition } from "react";
import Link from "next/link";
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
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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

type RecipeTableProps = {
  recipes: RecipeListItem[];
  currentUserId: string | null;
  showAuthor?: boolean;
  showLikes?: boolean;
  showManagementActions?: boolean;
  openRecipeHrefs?: Record<string, string>;
  categories: CategoryOption[];
};

function RecipeTableRow({
  recipe,
  currentUserId,
  showLikes,
  showManagementActions = true,
  openRecipeHref,
  onView,
  onEdit,
  onDelete,
}: {
  recipe: RecipeListItem;
  currentUserId: string | null;
  showLikes?: boolean;
  showManagementActions?: boolean;
  openRecipeHref?: string;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [optimisticRecipe, setOptimisticRecipe] = useOptimistic(
    recipe,
    (state, update: Partial<RecipeListItem>) => ({ ...state, ...update }),
  );

  const isOwner = currentUserId === recipe.ownerId;
  const categoryName = optimisticRecipe.category?.category ?? "Без категории";
  const showFavoriteStar =
    showManagementActions && Boolean(currentUserId) && (isOwner || showLikes);
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
      {showManagementActions ? (
        <TableCell>
          <RecipePublicToggle
            recipeId={recipe.id}
            visibility={optimisticRecipe.visibility}
            isOwner={isOwner}
          />
        </TableCell>
      ) : null}
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
              {openRecipeHref ? (
                <Link
                  href={openRecipeHref}
                  aria-label="Открыть"
                  className={buttonVariants({
                    variant: "outline",
                    size: "icon",
                    className: "h-8 w-8",
                  })}
                >
                  <Eye className="h-3.5 w-3.5" />
                </Link>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  aria-label="Открыть"
                  onClick={onView}
                >
                  <Eye className="h-3.5 w-3.5" />
                </Button>
              )}
            </TooltipTrigger>
            <TooltipContent side="top">Открыть</TooltipContent>
          </Tooltip>
          <CopyRecipeButton
            title={optimisticRecipe.title}
            categoryName={categoryName}
            content={optimisticRecipe.content}
          />
          {isOwner && showManagementActions ? (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    aria-label="Изменить"
                    onClick={onEdit}
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
                    onClick={onDelete}
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
  );
}

function RecipeTableRowDialogs({
  recipe,
  currentUserId,
  showAuthor,
  showManagementActions = true,
  categories,
  viewOpen,
  editOpen,
  deleteOpen,
  onViewOpenChange,
  onEditOpenChange,
  onDeleteOpenChange,
}: {
  recipe: RecipeListItem;
  currentUserId: string | null;
  showAuthor?: boolean;
  showManagementActions?: boolean;
  categories: CategoryOption[];
  viewOpen: boolean;
  editOpen: boolean;
  deleteOpen: boolean;
  onViewOpenChange: (open: boolean) => void;
  onEditOpenChange: (open: boolean) => void;
  onDeleteOpenChange: (open: boolean) => void;
}) {
  const isOwner = currentUserId === recipe.ownerId;

  return (
    <>
      <RecipeViewDialog
        open={viewOpen}
        onOpenChange={onViewOpenChange}
        recipe={recipe}
        showAuthor={showAuthor}
        onEdit={
          isOwner && showManagementActions
            ? () => {
                onViewOpenChange(false);
                onEditOpenChange(true);
              }
            : undefined
        }
      />

      {isOwner && showManagementActions ? (
        <>
          <RecipeDialog
            open={editOpen}
            onOpenChange={onEditOpenChange}
            mode="edit"
            recipe={recipe}
            categories={categories}
          />
          <DeleteRecipeDialog
            open={deleteOpen}
            onOpenChange={onDeleteOpenChange}
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
  showManagementActions = true,
  openRecipeHrefs,
  categories,
}: RecipeTableProps) {
  const [viewRecipeId, setViewRecipeId] = useState<string | null>(null);
  const [editRecipeId, setEditRecipeId] = useState<string | null>(null);
  const [deleteRecipeId, setDeleteRecipeId] = useState<string | null>(null);

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10" />
              <TableHead>Название</TableHead>
              <TableHead>Описание</TableHead>
              <TableHead>Категория</TableHead>
              <TableHead>Обновлено</TableHead>
              {showManagementActions ? (
                <TableHead className="w-12">Доступ</TableHead>
              ) : null}
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
                showLikes={showLikes}
                showManagementActions={showManagementActions}
                openRecipeHref={openRecipeHrefs?.[recipe.id]}
                onView={() => setViewRecipeId(recipe.id)}
                onEdit={() => setEditRecipeId(recipe.id)}
                onDelete={() => setDeleteRecipeId(recipe.id)}
              />
            ))}
          </TableBody>
        </Table>
      </div>
      {recipes.map((recipe) => (
        <RecipeTableRowDialogs
          key={`dialogs-${recipe.id}`}
          recipe={recipe}
          currentUserId={currentUserId}
          showAuthor={showAuthor}
          showManagementActions={showManagementActions}
          categories={categories}
          viewOpen={viewRecipeId === recipe.id}
          editOpen={editRecipeId === recipe.id}
          deleteOpen={deleteRecipeId === recipe.id}
          onViewOpenChange={(open) => {
            if (!open) {
              setViewRecipeId(null);
            }
          }}
          onEditOpenChange={(open) => {
            if (!open) {
              setEditRecipeId(null);
            }
          }}
          onDeleteOpenChange={(open) => {
            if (!open) {
              setDeleteRecipeId(null);
            }
          }}
        />
      ))}
    </>
  );
}
