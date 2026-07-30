import { DashboardHeader } from "@/app/dashboard/_components/dashboard-header";
import { EmptyState } from "@/app/dashboard/_components/empty-state";
import { RecipeList } from "@/app/dashboard/_components/recipe-list";
import { RecipeListToolbar } from "@/app/dashboard/_components/recipe-list-toolbar";
import { RecipePagination } from "@/app/dashboard/_components/recipe-pagination";
import { requireAuth } from "@/lib/auth";
import {
  parseCategoryParam,
  parseSearchQuery,
  parseViewParam,
} from "@/lib/recipes/helpers";
import { getCategories, getFavoriteRecipes } from "@/lib/recipes/queries";

export const dynamic = "force-dynamic";

type FavoritesPageProps = {
  searchParams: Promise<{
    q?: string;
    page?: string;
    category?: string;
    view?: string;
  }>;
};

export default async function FavoritesPage({ searchParams }: FavoritesPageProps) {
  const session = await requireAuth();
  const params = await searchParams;
  const q = parseSearchQuery(params.q);
  const view = parseViewParam(params.view);
  const category = parseCategoryParam(params.category);

  const categories = await getCategories();
  const data = await getFavoriteRecipes(session.user.id, params);

  return (
    <>
      <DashboardHeader user={session.user} title="Избранное" />

      <RecipeListToolbar categories={categories} />

      {data.total === 0 ? (
        q || category ? (
          <EmptyState title="По вашему запросу ничего не найдено" />
        ) : (
          <EmptyState title="В избранном пока ничего нет" showRecipeIcon />
        )
      ) : (
        <>
          <RecipeList
            recipes={data.items}
            currentUserId={session.user.id}
            categories={categories}
            view={view}
          />
          <RecipePagination
            page={data.page}
            totalPages={data.totalPages}
            basePath="/dashboard/favorites"
            q={q}
            category={category}
            view={view}
          />
        </>
      )}
    </>
  );
}
