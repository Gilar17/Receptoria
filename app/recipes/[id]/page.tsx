import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CopyRecipeTextButton } from "@/app/dashboard/_components/copy-recipe-button";
import { LikeButton } from "@/components/recipes/LikeButton";
import { getCurrentUserId } from "@/lib/auth";
import { formatRecipeDate } from "@/lib/recipes/helpers";
import {
  getRecipeForPublicView,
  type RecipeListItem,
} from "@/lib/recipes/queries";

export const dynamic = "force-dynamic";

type RecipePageProps = {
  params: Promise<{ id: string }>;
};

export default async function RecipePage({ params }: RecipePageProps) {
  const { id } = await params;
  const currentUserId = await getCurrentUserId();

  let recipe: RecipeListItem | null = null;

  try {
    recipe = await getRecipeForPublicView(id, currentUserId);
  } catch (error) {
    console.error("recipe.view:", error);
    notFound();
  }

  if (!recipe) {
    notFound();
  }

  const categoryName = recipe.category?.category ?? "Без категории";
  const displayDate = recipe.publishedAt ?? recipe.createdAt;
  const cardDescription = recipe.description?.trim() || recipe.content;

  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <Button asChild variant="ghost" size="sm" className="mb-6 -ml-2">
        <Link href="/catalog">
          <ArrowLeft className="h-4 w-4" />
          К каталогу
        </Link>
      </Button>

      <header className="space-y-4">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
          {recipe.title}
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="gap-1 font-normal">
            <Tag className="h-3 w-3" />
            {categoryName}
          </Badge>
          {recipe.tags?.map((tag) => (
            <Badge key={tag.id} variant="outline" className="font-normal">
              {tag.name}
            </Badge>
          ))}
          <span className="text-sm text-slate-500">
            {formatRecipeDate(displayDate)}
          </span>
        </div>
      </header>

      <div className="mt-6 flex items-center gap-3">
        {recipe.owner.image ? (
          <Image
            src={recipe.owner.image}
            alt={recipe.owner.name ?? "Автор"}
            width={40}
            height={40}
            className="rounded-full"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-sm font-medium text-slate-700">
            {(recipe.owner.name?.[0] ?? "A").toUpperCase()}
          </div>
        )}
        <div>
          <p className="text-xs text-slate-500">Автор</p>
          <p className="text-sm font-medium text-slate-800">
            {recipe.owner.name ?? "Автор"}
          </p>
        </div>
      </div>

      <div className="mt-8 whitespace-pre-wrap rounded-xl border border-slate-200 bg-white p-6 text-sm leading-relaxed text-slate-700 shadow-sm">
        {cardDescription}
      </div>

      <footer className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-6">
        <CopyRecipeTextButton
          title={recipe.title}
          categoryName={categoryName}
          content={recipe.content}
        />
        <LikeButton
          recipeId={recipe.id}
          initialLiked={recipe.likedByMe ?? false}
          initialCount={recipe.likesCount ?? 0}
        />
      </footer>
    </article>
  );
}
