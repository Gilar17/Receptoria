import { getCurrentUserId } from "@/lib/auth";
import { EmptyState } from "@/app/dashboard/_components/empty-state";
import { RecipeList } from "@/app/dashboard/_components/recipe-list";
import { RecipeListToolbar } from "@/app/dashboard/_components/recipe-list-toolbar";
import { RecipePagination } from "@/app/dashboard/_components/recipe-pagination";
import {
  parseCategoryParam,
  parseSearchQuery,
  parseSortParam,
  parseViewParam,
} from "@/lib/recipes/helpers";
import {
  getCategories,
  getPublicRecipesPaginated,
  type CategoryOption,
  type PaginatedRecipes,
} from "@/lib/recipes/queries";

export const dynamic = "force-dynamic";

type CatalogPageProps = {
  searchParams: Promise<{
    q?: string;
    page?: string;
    category?: string;
    view?: string;
    sort?: string;
  }>;
};

export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  const params = await searchParams;
  const currentUserId = await getCurrentUserId();
  const q = parseSearchQuery(params.q);
  const view = parseViewParam(params.view);
  const category = parseCategoryParam(params.category);
  const sort = parseSortParam(params.sort);

  let categories: CategoryOption[] = [];
  let data: PaginatedRecipes | null = null;
  let dbError = false;

  try {
    categories = await getCategories();
    data = await getPublicRecipesPaginated(params, currentUserId);
  } catch (error) {
    console.error("catalog.load:", error);
    dbError = true;
  }

  if (dbError || !data) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <EmptyState title="Не удалось загрузить рецепты. Попробуйте обновить страницу." />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <header className="mb-6 space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
          Каталог рецептов
        </h1>
        <p className="text-slate-600">
          Публичные рецепты от пользователей Receptoria
        </p>
      </header>

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
            currentUserId={currentUserId}
            showAuthor
            showLikes
            showManagementActions={false}
            openRecipeHref={(id) => `/recipes/${id}`}
            categories={categories}
            view={view}
            gridClassName="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          />
          <RecipePagination
            page={data.page}
            totalPages={data.totalPages}
            basePath="/catalog"
            q={q}
            category={category}
            view={view}
            sort={sort}
          />
        </>
      )}
    </div>
  );
}
