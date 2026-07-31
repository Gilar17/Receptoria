"use client";

import { useState } from "react";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type RecipeCopyFields = {
  title: string;
  categoryName: string;
  content: string;
};

export function formatRecipeCopyText({
  title,
  categoryName,
  content,
}: RecipeCopyFields): string {
  return `${title}\n\nКатегория: ${categoryName}\n\n${content}`;
}

export async function copyRecipeToClipboard(
  fields: RecipeCopyFields,
): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(formatRecipeCopyText(fields));
    return true;
  } catch {
    return false;
  }
}

type CopyRecipeButtonProps = RecipeCopyFields & {
  className?: string;
};

export function CopyRecipeButton({
  title,
  categoryName,
  content,
  className,
}: CopyRecipeButtonProps) {
  const [copying, setCopying] = useState(false);

  const handleCopy = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    if (copying) return;

    setCopying(true);
    try {
      const ok = await copyRecipeToClipboard({ title, categoryName, content });
      if (ok) {
        toast.success("Рецепт скопирован");
      } else {
        toast.error("Не удалось скопировать рецепт");
      }
    } finally {
      setCopying(false);
    }
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={handleCopy}
          disabled={copying}
          className={cn(
            "rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 active:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50",
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

type CopyRecipeTextButtonProps = RecipeCopyFields & {
  className?: string;
};

export function CopyRecipeTextButton({
  title,
  categoryName,
  content,
  className,
}: CopyRecipeTextButtonProps) {
  const handleCopy = async () => {
    const ok = await copyRecipeToClipboard({ title, categoryName, content });
    if (ok) {
      toast.success("Рецепт скопирован");
    } else {
      toast.error("Не удалось скопировать рецепт");
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleCopy}
      className={className}
      aria-label="Копировать рецепт"
    >
      <Copy className="h-4 w-4" />
      Копировать
    </Button>
  );
}
