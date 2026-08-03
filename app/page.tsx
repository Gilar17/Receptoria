import { getCurrentUserId } from "@/lib/auth";
import { HomeHero } from "@/app/_components/home-hero";
import { HomeRecipeSection } from "@/app/_components/home-recipe-section";
import { EmptyState } from "@/app/dashboard/_components/empty-state";
import {
  getHomePageData,
  type CategoryOption,
  type RecipeListItem,
} from "@/lib/recipes/queries";

export const dynamic = "force-dynamic";

export default async function Home() {
  const currentUserId = await getCurrentUserId();

  let recent: RecipeListItem[] = [];
  let popular: RecipeListItem[] = [];
  let categories: CategoryOption[] = [];
  let dbError = false;

  try {
    const homeData = await getHomePageData(currentUserId);
    recent = homeData.recent;
    popular = homeData.popular;
    categories = homeData.categories;
  } catch (error) {
    console.error("home.recipes:", error);
    dbError = true;
  }

  if (dbError) {
    return (
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <HomeHero isAuthenticated={Boolean(currentUserId)} />
        <EmptyState title="Не удалось загрузить рецепты. Попробуйте обновить страницу." />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-12 px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <HomeHero isAuthenticated={Boolean(currentUserId)} />

      <HomeRecipeSection
        title="Новые рецепты"
        recipes={recent}
        currentUserId={currentUserId}
        categories={categories}
        emptyTitle="Пока нет публичных рецептов"
      />

      <HomeRecipeSection
        title="Популярные рецепты"
        recipes={popular}
        currentUserId={currentUserId}
        categories={categories}
        emptyTitle="Пока нет популярных рецептов"
      />
    </div>
  );
}
