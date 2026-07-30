"use client";

import { useState } from "react";
import { toast } from "sonner";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { deleteRecipe } from "@/lib/recipes/actions";
import {
  buildRecipeListHref,
  readRecipeListParams,
} from "@/lib/recipes/url-params";

type RecipeListSection = "mine" | "public" | "favorites";

function getListSection(pathname: string): RecipeListSection {
  if (pathname.startsWith("/dashboard/public")) {
    return "public";
  }
  if (pathname.startsWith("/dashboard/favorites")) {
    return "favorites";
  }
  return "mine";
}

type DeleteRecipeDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipeId: string;
  recipeTitle: string;
};

export function DeleteRecipeDialog({
  open,
  onOpenChange,
  recipeId,
  recipeTitle,
}: DeleteRecipeDialogProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    const { page, q, category, view } = readRecipeListParams(searchParams);

    const result = await deleteRecipe({
      id: recipeId,
      page,
      q,
      category: category ?? "",
      listSection: getListSection(pathname),
    });
    setDeleting(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success(result.message ?? "Рецепт удалён");
    onOpenChange(false);

    const redirectPage = result.data?.redirectPage ?? page;

    if (redirectPage !== page) {
      router.push(
        buildRecipeListHref(pathname, {
          page: redirectPage,
          q,
          category,
          view,
        }),
      );
      return;
    }

    router.refresh();
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Удалить рецепт?</AlertDialogTitle>
          <AlertDialogDescription>
            Это действие нельзя отменить. Рецепт «{recipeTitle}» будет удалён без
            возможности восстановления.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Отмена</AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? "Удаление..." : "Удалить"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
