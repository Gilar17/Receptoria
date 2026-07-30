import { RecipeCard } from "@/app/dashboard/_components/recipe-card";
import { RecipeTable } from "@/app/dashboard/_components/recipe-table";
import type { CategoryOption, RecipeListItem } from "@/lib/recipes/queries";
import type { RecipeViewMode } from "@/lib/recipes/helpers";

type RecipeListProps = {
  recipes: RecipeListItem[];
  currentUserId: string | null;
  showAuthor?: boolean;
  categories: CategoryOption[];
  view?: RecipeViewMode;
};

export function RecipeList({
  recipes,
  currentUserId,
  showAuthor = false,
  categories,
  view = "cards",
}: RecipeListProps) {
  if (view === "table") {
    return (
      <RecipeTable
        recipes={recipes}
        currentUserId={currentUserId}
        showAuthor={showAuthor}
        categories={categories}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3">
      {recipes.map((recipe) => (
        <RecipeCard
          key={recipe.id}
          recipe={recipe}
          currentUserId={currentUserId}
          showAuthor={showAuthor}
          categories={categories}
        />
      ))}
    </div>
  );
}
