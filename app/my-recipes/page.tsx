import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { getRecipesByOwner } from "@/lib/recipes";

export const dynamic = "force-dynamic";

/**
 * «Мои рецепты» — только записи текущего владельца (ownerId === session.user.id).
 */
export default async function MyRecipesPage() {
  const session = await requireAuth();
  const recipes = await getRecipesByOwner(session.user.id);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 px-4 py-10">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Мои рецепты</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Только ваши записи. Приватные рецепты недоступны другим пользователям.
          </p>
        </div>
        <Link
          href="/dashboard"
          className="text-sm text-zinc-600 transition hover:text-zinc-900"
        >
          Кабинет
        </Link>
      </header>

      {recipes.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-center text-sm text-zinc-500">
          У вас пока нет рецептов.
        </p>
      ) : (
        <ul className="space-y-3">
          {recipes.map((recipe) => (
            <li
              key={recipe.id}
              className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <h2 className="font-medium text-zinc-900">{recipe.title}</h2>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                    recipe.visibility === "PRIVATE"
                      ? "bg-amber-50 text-amber-800"
                      : "bg-emerald-50 text-emerald-800"
                  }`}
                >
                  {recipe.visibility === "PRIVATE" ? "Приватный" : "Публичный"}
                </span>
              </div>
              {recipe.description ? (
                <p className="mt-2 line-clamp-2 text-sm text-zinc-600">
                  {recipe.description}
                </p>
              ) : null}
              <p className="mt-3 text-xs text-zinc-400">
                {recipe.category.category} · обновлён{" "}
                {recipe.updatedAt.toLocaleDateString("ru-RU")}
              </p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
