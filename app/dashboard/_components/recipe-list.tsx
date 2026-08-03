import { RecipeCard } from "@/app/dashboard/_components/recipe-card";
import { RecipeTable } from "@/app/dashboard/_components/recipe-table";
import type { CategoryOption, RecipeListItem } from "@/lib/recipes/queries";
import type { RecipeViewMode } from "@/lib/recipes/helpers";

type RecipeListProps = {
  recipes: RecipeListItem[];
  currentUserId: string | null;
  showAuthor?: boolean;
  showLikes?: boolean;
  showManagementActions?: boolean;
  openRecipeHref?: (recipeId: string) => string;
  categories: CategoryOption[];
  view?: RecipeViewMode;
  gridClassName?: string;
};

export function RecipeList({
  recipes,
  currentUserId,
  showAuthor = false,
  showLikes = false,
  showManagementActions = true,
  openRecipeHref,
  categories,
  view = "cards",
  gridClassName = "grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3",
}: RecipeListProps) {
  if (view === "table") {
    const openRecipeHrefs = openRecipeHref
      ? Object.fromEntries(
          recipes.map((recipe) => [recipe.id, openRecipeHref(recipe.id)]),
        )
      : undefined;

    return (
      <RecipeTable
        recipes={recipes}
        currentUserId={currentUserId}
        showAuthor={showAuthor}
        showLikes={showLikes}
        showManagementActions={showManagementActions}
        openRecipeHrefs={openRecipeHrefs}
        categories={categories}
      />
    );
  }

  return (
    <div className={gridClassName}>
      {recipes.map((recipe) => (
        <RecipeCard
          key={recipe.id}
          recipe={recipe}
          currentUserId={currentUserId}
          showAuthor={showAuthor}
          showLikes={showLikes}
          showManagementActions={showManagementActions}
          openRecipeHref={openRecipeHref?.(recipe.id)}
          categories={categories}
        />
      ))}
    </div>
  );
}
