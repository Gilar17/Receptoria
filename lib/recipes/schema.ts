import { z } from "zod";

export const recipeFormSchema = z.object({
  title: z
    .string({ message: "Введите название рецепта" })
    .trim()
    .min(2, "Название должно содержать не менее 2 символов")
    .max(150, "Название не должно превышать 150 символов"),
  content: z
    .string({ message: "Введите текст рецепта" })
    .trim()
    .min(10, "Текст рецепта должен содержать не менее 10 символов")
    .max(20000, "Текст рецепта не должен превышать 20 000 символов"),
  isPublic: z.boolean(),
  categoryId: z.string().trim().min(1, "Выберите категорию").optional(),
});

export type RecipeFormValues = z.infer<typeof recipeFormSchema>;

export const recipeIdSchema = z
  .string()
  .trim()
  .min(1, "Некорректный идентификатор рецепта");

export const updateRecipeSchema = recipeFormSchema.extend({
  id: recipeIdSchema,
});

export const recipeListSectionSchema = z.enum(["mine", "public", "favorites"]);

export const deleteRecipeSchema = z.object({
  id: recipeIdSchema,
  page: z.coerce.number().int().min(1).optional().default(1),
  q: z.string().optional().default(""),
  category: z.string().optional().default(""),
  listSection: recipeListSectionSchema.optional().default("mine"),
});

export const togglePublicSchema = z.object({
  id: recipeIdSchema,
  isPublic: z.boolean(),
});

export const toggleFavoriteSchema = z.object({
  id: recipeIdSchema,
});
