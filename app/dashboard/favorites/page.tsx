import { Suspense } from "react";
import { DashboardHeader } from "@/app/dashboard/_components/dashboard-header";
import { EmptyState } from "@/app/dashboard/_components/empty-state";
import { RecipeList } from "@/app/dashboard/_components/recipe-list";
import { RecipePagination } from "@/app/dashboard/_components/recipe-pagination";
import { RecipeSearch } from "@/app/dashboard/_components/recipe-search";
import { requireAuth } from "@/lib/auth";
import { getFavoriteRecipes } from "@/lib/recipes/queries";
import { parseSearchQuery } from "@/lib/recipes/helpers";

export const dynamic = "force-dynamic";

type FavoritesPageProps = {
  searchParams: Promise<{ q?: string; page?: string }>;
};

export default async function FavoritesPage({ searchParams }: FavoritesPageProps) {
  const session = await requireAuth();
  const params = await searchParams;
  const q = parseSearchQuery(params.q);
  const data = await getFavoriteRecipes(session.user.id, params);

  return (
    <>
      <DashboardHeader user={session.user} sectionTitle="Избранное" />

      <Suspense fallback={null}>
        <RecipeSearch />
      </Suspense>

      {data.total === 0 ? (
        q ? (
          <EmptyState title="По вашему запросу ничего не найдено" />
        ) : (
          <EmptyState title="В избранном пока ничего нет" />
        )
      ) : (
        <>
          <RecipeList recipes={data.items} currentUserId={session.user.id} />
          <RecipePagination
            page={data.page}
            totalPages={data.totalPages}
            basePath="/dashboard/favorites"
            q={q}
          />
        </>
      )}
    </>
  );
}
