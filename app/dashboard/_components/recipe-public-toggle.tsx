"use client";

import { useOptimistic, useTransition } from "react";
import { Globe, Lock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import type { RecipeVisibility } from "@prisma/client";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toggleRecipePublic } from "@/lib/recipes/actions";
import { isPublicVisibility } from "@/lib/recipes/helpers";
import { cn } from "@/lib/utils";

type RecipePublicToggleProps = {
  recipeId: string;
  visibility: RecipeVisibility;
  isOwner: boolean;
};

export function RecipePublicToggle({
  recipeId,
  visibility,
  isOwner,
}: RecipePublicToggleProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [optimisticVisibility, setOptimisticVisibility] = useOptimistic(
    visibility,
    (_state, next: RecipeVisibility) => next,
  );

  const isPublic = isPublicVisibility(optimisticVisibility);

  const handleClick = () => {
    if (!isOwner || isPending) return;

    const nextPublic = !isPublic;
    const previous = optimisticVisibility;

    startTransition(async () => {
      setOptimisticVisibility(nextPublic ? "PUBLIC" : "PRIVATE");
      const result = await toggleRecipePublic({
        id: recipeId,
        isPublic: nextPublic,
      });
      if (!result.success) {
        setOptimisticVisibility(previous);
        toast.error("Не удалось изменить публичность рецепта");
        return;
      }
      toast.success(
        nextPublic ? "Рецепт теперь публичный" : "Рецепт теперь приватный",
      );
      router.refresh();
    });
  };

  if (!isOwner) {
    if (!isPublic) return null;
    return (
      <Globe
        className="h-4 w-4 shrink-0 text-emerald-500"
        aria-hidden="true"
      />
    );
  }

  const Icon = isPublic ? Globe : Lock;
  const tooltip = isPublic ? "Сделать приватным" : "Сделать публичным";
  const ariaLabel = isPublic
    ? "Сделать рецепт приватным"
    : "Сделать рецепт публичным";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={handleClick}
          disabled={isPending}
          className={cn(
            "shrink-0 rounded-md p-1 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 disabled:opacity-50",
            isPublic
              ? "text-emerald-500 hover:text-emerald-600"
              : "text-slate-400 hover:text-slate-600",
          )}
          aria-label={ariaLabel}
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Icon className="h-4 w-4" />
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent side="top">{tooltip}</TooltipContent>
    </Tooltip>
  );
}
