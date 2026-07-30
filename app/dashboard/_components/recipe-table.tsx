"use client";

import { useOptimistic, useState, useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  BookOpenText,
  Eye,
  Globe,
  Lock,
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
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { DeleteRecipeDialog } from "@/app/dashboard/_components/delete-recipe-dialog";
import { RecipeDialog } from "@/app/dashboard/_components/recipe-dialog";
import { RecipeViewDialog } from "@/app/dashboard/_components/recipe-view-dialog";
import {
  toggleRecipeFavorite,
  toggleRecipePublic,
} from "@/lib/recipes/actions";
import { formatRecipeDate, isPublicVisibility } from "@/lib/recipes/helpers";
import type { CategoryOption, RecipeListItem } from "@/lib/recipes/queries";

type RecipeTableProps = {
  recipes: RecipeListItem[];
  currentUserId: string | null;
  showAuthor?: boolean;
  categories: CategoryOption[];
};

function RecipeTableRow({
  recipe,
  currentUserId,
  showAuthor,
  categories,
}: {
  recipe: RecipeListItem;
  currentUserId: string | null;
  showAuthor?: boolean;
  categories: CategoryOption[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [optimisticRecipe, setOptimisticRecipe] = useOptimistic(
    recipe,
    (state, update: Partial<RecipeListItem>) => ({ ...state, ...update }),
  );

  const [viewOpen, setViewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const isOwner = currentUserId === recipe.ownerId;
  const isPublic = isPublicVisibility(optimisticRecipe.visibility);
  const preview =
    optimisticRecipe.content.length > 80
      ? `${optimisticRecipe.content.slice(0, 80).trim()}…`
      : optimisticRecipe.content;

  const handleToggleFavorite = () => {
    if (!isOwner) return;
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

  const handleTogglePublic = (checked: boolean) => {
    if (!isOwner) return;
    const previous = isPublicVisibility(optimisticRecipe.visibility);
    startTransition(async () => {
      setOptimisticRecipe({ visibility: checked ? "PUBLIC" : "PRIVATE" });
      const result = await toggleRecipePublic({
        id: recipe.id,
        isPublic: checked,
      });
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
      <TableRow>
        <TableCell className="w-10">
          {isOwner ? (
            <button
              type="button"
              onClick={handleToggleFavorite}
              disabled={isPending}
              className="rounded-md p-1 text-slate-400 hover:text-amber-500"
              aria-label={
                optimisticRecipe.isFavorite ? "Убрать из избранного" : "В избранное"
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
            {optimisticRecipe.category?.category ?? "Без категории"}
          </Badge>
        </TableCell>
        <TableCell className="whitespace-nowrap text-xs text-slate-500">
          {formatRecipeDate(optimisticRecipe.updatedAt)}
        </TableCell>
        <TableCell>
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
        </TableCell>
        <TableCell>
          <div className="flex flex-wrap items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8"
              title="Просмотреть"
              onClick={() => setViewOpen(true)}
            >
              <Eye className="h-3.5 w-3.5" />
            </Button>
            {isOwner ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  title="Редактировать"
                  onClick={() => setEditOpen(true)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  title="Удалить"
                  onClick={() => setDeleteOpen(true)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
                <Switch
                  checked={isPublic}
                  onCheckedChange={handleTogglePublic}
                  disabled={isPending}
                  aria-label="Публичность"
                />
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
            <TableHead>Статус</TableHead>
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
              categories={categories}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
