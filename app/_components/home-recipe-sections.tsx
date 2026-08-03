import { getCurrentUserId } from "@/lib/auth";
import { HomeRecipeSection } from "@/app/_components/home-recipe-section";
import { EmptyState } from "@/app/dashboard/_components/empty-state";
import { getHomePageData } from "@/lib/recipes/queries";

export async function HomeRecipeSections() {
  const currentUserId = await getCurrentUserId();

  try {
    const { recent, popular, categories } = await getHomePageData(currentUserId);

    return (
      <>
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
      </>
    );
  } catch (error) {
    console.error("home.recipes:", error);
    return (
      <EmptyState title="Не удалось загрузить рецепты. Попробуйте обновить страницу." />
    );
  }
}
