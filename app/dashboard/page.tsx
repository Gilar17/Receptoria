import { Button } from "@/components/ui/button";
import { DashboardHeader } from "@/app/dashboard/_components/dashboard-header";
import { EmptyState } from "@/app/dashboard/_components/empty-state";
import { RecipeCreateButton } from "@/app/dashboard/_components/recipe-create-button";
import { RecipeList } from "@/app/dashboard/_components/recipe-list";
import { RecipeListToolbar } from "@/app/dashboard/_components/recipe-list-toolbar";
import { RecipePagination } from "@/app/dashboard/_components/recipe-pagination";
import { requireAuth } from "@/lib/auth";
import {
  parseCategoryParam,
  parseSearchQuery,
  parseViewParam,
} from "@/lib/recipes/helpers";
import { getCategories, getMyRecipes } from "@/lib/recipes/queries";

export const dynamic = "force-dynamic";

type DashboardPageProps = {
  searchParams: Promise<{
    q?: string;
    page?: string;
    category?: string;
    view?: string;
  }>;
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const session = await requireAuth();
  const params = await searchParams;
  const q = parseSearchQuery(params.q);
  const view = parseViewParam(params.view);
  const category = parseCategoryParam(params.category);

  const categories = await getCategories();
  const data = await getMyRecipes(session.user.id, params);

  const isSearch = Boolean(q) || Boolean(category);
  const isEmpty = data.total === 0;

  return (
    <>
      <DashboardHeader
        user={session.user}
        title="Мои рецепты"
        showCreate
        categories={categories}
      />

      <RecipeListToolbar categories={categories} />

      {!isEmpty ? (
        <p className="mb-4 text-sm text-slate-500">
          Найдено рецептов: {data.total}
        </p>
      ) : null}

      {isEmpty ? (
        isSearch ? (
          <EmptyState title="По вашему запросу ничего не найдено" />
        ) : (
          <EmptyState
            title="У вас пока нет рецептов — создайте первый"
            showRecipeIcon
            action={
              <RecipeCreateButton categories={categories}>
                <Button>Создать рецепт</Button>
              </RecipeCreateButton>
            }
          />
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
            basePath="/dashboard"
            q={q}
            category={category}
            view={view}
          />
        </>
      )}
    </>
  );
}
