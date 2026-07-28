import { Suspense } from "react";
import { DashboardHeader } from "@/app/dashboard/_components/dashboard-header";
import { EmptyState } from "@/app/dashboard/_components/empty-state";
import { RecipeList } from "@/app/dashboard/_components/recipe-list";
import { RecipePagination } from "@/app/dashboard/_components/recipe-pagination";
import { RecipeSearch } from "@/app/dashboard/_components/recipe-search";
import { requireAuth } from "@/lib/auth";
import { getPublicRecipesPaginated } from "@/lib/recipes/queries";
import { parseSearchQuery } from "@/lib/recipes/helpers";

export const dynamic = "force-dynamic";

type PublicPageProps = {
  searchParams: Promise<{ q?: string; page?: string }>;
};

export default async function PublicRecipesPage({
  searchParams,
}: PublicPageProps) {
  const session = await requireAuth();
  const params = await searchParams;
  const q = parseSearchQuery(params.q);
  const data = await getPublicRecipesPaginated(params);

  return (
    <>
      <DashboardHeader
        user={session.user}
        sectionTitle="Публичные рецепты"
      />

      <Suspense fallback={null}>
        <RecipeSearch />
      </Suspense>

      {data.total > 0 ? (
        <p className="mb-4 text-sm text-slate-500">
          Найдено рецептов: {data.total}
        </p>
      ) : null}

      {data.total === 0 ? (
        q ? (
          <EmptyState title="По вашему запросу ничего не найдено" />
        ) : (
          <EmptyState title="Публичных рецептов пока нет" />
        )
      ) : (
        <>
          <RecipeList
            recipes={data.items}
            currentUserId={session.user.id}
            showAuthor
          />
          <RecipePagination
            page={data.page}
            totalPages={data.totalPages}
            basePath="/dashboard/public"
            q={q}
          />
        </>
      )}
    </>
  );
}
