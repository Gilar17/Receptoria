import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

type HomeHeroProps = {
  isAuthenticated: boolean;
};

export function HomeHero({ isAuthenticated }: HomeHeroProps) {
  const addRecipeHref = isAuthenticated
    ? "/dashboard"
    : "/login?callbackUrl=%2Fdashboard";

  return (
    <section className="rounded-2xl border border-slate-200 bg-gradient-to-br from-[#e8f4fc] to-white px-6 py-10 shadow-sm sm:px-10 sm:py-14">
      <p className="text-sm font-medium uppercase tracking-wide text-sky-700">
        Receptoria
      </p>
      <h1 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
        Сохраняйте любимые рецепты и делитесь ими
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
        Создавайте собственную коллекцию рецептов, находите новые идеи и
        сохраняйте понравившиеся блюда в избранное.
      </p>
      <div className="mt-8 flex flex-col items-start gap-2">
        <Button asChild size="lg" className="w-full sm:w-auto">
          <Link href={addRecipeHref}>
            <Plus className="h-4 w-4" />
            Добавить рецепт
          </Link>
        </Button>
        {!isAuthenticated ? (
          <p className="text-sm text-slate-500">Войдите, чтобы добавлять рецепты</p>
        ) : null}
      </div>
    </section>
  );
}
