import { DashboardHeader } from "@/app/dashboard/_components/dashboard-header";
import { EmptyState } from "@/app/dashboard/_components/empty-state";
import { RecipeList } from "@/app/dashboard/_components/recipe-list";
import { RecipeListToolbar } from "@/app/dashboard/_components/recipe-list-toolbar";
import { RecipePagination } from "@/app/dashboard/_components/recipe-pagination";
import { requireAuth } from "@/lib/auth";
import {
  parseCategoryParam,
  parseSearchQuery,
  parseSortParam,
  parseViewParam,
} from "@/lib/recipes/helpers";
import { getCategories, getPublicRecipesPaginated } from "@/lib/recipes/queries";

export const dynamic = "force-dynamic";

type PublicPageProps = {
  searchParams: Promise<{
    q?: string;
    page?: string;
    category?: string;
    view?: string;
    sort?: string;
  }>;
};

export default async function PublicRecipesPage({
  searchParams,
}: PublicPageProps) {
  const session = await requireAuth();
  const params = await searchParams;
  const q = parseSearchQuery(params.q);
  const view = parseViewParam(params.view);
  const category = parseCategoryParam(params.category);
  const sort = parseSortParam(params.sort);

  const categories = await getCategories();
  const data = await getPublicRecipesPaginated(params, session.user.id);

  return (
    <>
      <DashboardHeader user={session.user} title="Публичные рецепты" />

      <RecipeListToolbar categories={categories} showSort />

      {data.total > 0 ? (
        <p className="mb-4 text-sm text-slate-500">
          Найдено рецептов: {data.total}
        </p>
      ) : null}

      {data.total === 0 ? (
        q || category ? (
          <EmptyState title="По вашему запросу ничего не найдено" />
        ) : (
          <EmptyState title="Публичных рецептов пока нет" showRecipeIcon />
        )
      ) : (
        <>
          <RecipeList
            recipes={data.items}
            currentUserId={session.user.id}
            showAuthor
            showLikes
            categories={categories}
            view={view}
          />
          <RecipePagination
            page={data.page}
            totalPages={data.totalPages}
            basePath="/dashboard/public"
            q={q}
            category={category}
            view={view}
            sort={sort}
          />
        </>
      )}
    </>
  );
}
