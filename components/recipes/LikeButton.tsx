"use client";

import { useState } from "react";
import { ThumbsUp } from "lucide-react";
import { toast } from "sonner";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

type LikeButtonProps = {
  recipeId: string;
  initialLiked: boolean;
  initialCount: number;
  className?: string;
};

type LikeResponse = {
  liked: boolean;
  likesCount: number;
};

export function LikeButton({
  recipeId,
  initialLiked,
  initialCount,
  className,
}: LikeButtonProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (loading) return;

    const previousLiked = liked;
    const previousCount = count;

    setLoading(true);
    setLiked(!liked);
    setCount(liked ? Math.max(0, count - 1) : count + 1);

    try {
      const response = await fetch(`/api/recipes/${recipeId}/like`, {
        method: "POST",
      });

      const data = (await response.json()) as LikeResponse & { error?: string };

      if (response.status === 401) {
        setLiked(previousLiked);
        setCount(previousCount);
        toast.error(data.error ?? "Чтобы поставить лайк, войдите в аккаунт");
        router.push(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
        return;
      }

      if (response.status === 404) {
        setLiked(previousLiked);
        setCount(previousCount);
        toast.error(data.error ?? "Публичный рецепт не найден");
        return;
      }

      if (!response.ok) {
        setLiked(previousLiked);
        setCount(previousCount);
        toast.error(
          data.error ?? "Не удалось поставить лайк. Попробуйте позже",
        );
        return;
      }

      setLiked(data.liked);
      setCount(data.likesCount);
    } catch {
      setLiked(previousLiked);
      setCount(previousCount);
      toast.error("Не удалось поставить лайк. Попробуйте позже");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      aria-label={liked ? "Убрать лайк" : "Поставить лайк"}
      aria-pressed={liked}
      className={cn(
        "inline-flex min-h-9 min-w-[3rem] shrink-0 items-center justify-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 disabled:cursor-not-allowed disabled:opacity-60",
        liked
          ? "bg-amber-50 text-amber-600 hover:bg-amber-100"
          : "bg-slate-100 text-slate-600 hover:bg-slate-200",
        className,
      )}
    >
      <ThumbsUp
        className={cn(
          "h-4 w-4 shrink-0",
          liked ? "fill-amber-400 text-amber-400" : "text-slate-500",
        )}
      />
      <span className="tabular-nums text-slate-700">{count}</span>
    </button>
  );
}
