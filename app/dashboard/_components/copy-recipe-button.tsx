"use client";

import { Copy } from "lucide-react";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type CopyRecipeButtonProps = {
  title: string;
  categoryName: string;
  content: string;
  className?: string;
};

function formatRecipeCopyText(
  title: string,
  categoryName: string,
  content: string,
): string {
  return `${title}\n\nКатегория: ${categoryName}\n\n${content}`;
}

export function CopyRecipeButton({
  title,
  categoryName,
  content,
  className,
}: CopyRecipeButtonProps) {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(
        formatRecipeCopyText(title, categoryName, content),
      );
      toast.success("Рецепт скопирован");
    } catch {
      toast.error("Не удалось скопировать рецепт");
    }
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={handleCopy}
          className={cn(
            "rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400",
            className,
          )}
          aria-label="Копировать рецепт"
        >
          <Copy className="h-4 w-4" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top">Копировать рецепт</TooltipContent>
    </Tooltip>
  );
}
