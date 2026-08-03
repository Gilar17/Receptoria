import { EmptyState } from "@/app/dashboard/_components/empty-state";
import { RecipeList } from "@/app/dashboard/_components/recipe-list";
import type { CategoryOption, RecipeListItem } from "@/lib/recipes/queries";

type HomeRecipeSectionProps = {
  title: string;
  recipes: RecipeListItem[];
  currentUserId: string | null;
  categories: CategoryOption[];
  emptyTitle: string;
};

const HOME_GRID_CLASS =
  "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";

export function HomeRecipeSection({
  title,
  recipes,
  currentUserId,
  categories,
  emptyTitle,
}: HomeRecipeSectionProps) {
  return (
    <section className="space-y-5">
      <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
        {title}
      </h2>
      {recipes.length === 0 ? (
        <EmptyState title={emptyTitle} showRecipeIcon />
      ) : (
        <RecipeList
          recipes={recipes}
          currentUserId={currentUserId}
          showAuthor
          showLikes
          showManagementActions={false}
          openRecipeHref={(id) => `/recipes/${id}`}
          categories={categories}
          gridClassName={HOME_GRID_CLASS}
        />
      )}
    </section>
  );
}
