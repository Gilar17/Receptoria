"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
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
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    const result = await deleteRecipe({ id: recipeId });
    setDeleting(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success(result.message ?? "Рецепт удалён");
    onOpenChange(false);
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
