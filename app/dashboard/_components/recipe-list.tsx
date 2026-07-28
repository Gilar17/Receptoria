import { RecipeCard } from "@/app/dashboard/_components/recipe-card";
import type { RecipeListItem } from "@/lib/recipes/queries";

type RecipeListProps = {
  recipes: RecipeListItem[];
  currentUserId: string | null;
  showAuthor?: boolean;
};

export function RecipeList({
  recipes,
  currentUserId,
  showAuthor = false,
}: RecipeListProps) {
  return (
    <div className="space-y-3">
      {recipes.map((recipe) => (
        <RecipeCard
          key={recipe.id}
          recipe={recipe}
          currentUserId={currentUserId}
          showAuthor={showAuthor}
        />
      ))}
    </div>
  );
}
