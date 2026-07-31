export const RECIPES_PAGE_SIZE = 10;

/** Категория по умолчанию для новых рецептов */
export const DEFAULT_CATEGORY_NAME = "Подкормка";

/** Основные категории в фиксированном порядке отображения */
export const PRIMARY_CATEGORY_NAMES = [
  "Подкормка",
  "Первые блюда",
  "Вторые блюда",
  "Горячие",
  "Десерты",
  "Соления",
] as const;

/** Прежние служебные категории — можно удалить, если не используются */
export const LEGACY_CATEGORY_NAMES = ["Общее", "Тестовая категория"] as const;
