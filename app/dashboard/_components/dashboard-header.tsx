import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashboardMobileMenu } from "@/app/dashboard/_components/dashboard-mobile-menu";
import { RecipeCreateButton } from "@/app/dashboard/_components/recipe-create-button";
import type { CategoryOption } from "@/lib/recipes/queries";

type DashboardHeaderProps = {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  title: string;
  showCreate?: boolean;
  categories?: CategoryOption[];
};

export function DashboardHeader({
  user,
  title,
  showCreate = false,
  categories = [],
}: DashboardHeaderProps) {
  return (
    <header className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <DashboardMobileMenu user={user} />
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          {title}
        </h1>
      </div>
      {showCreate ? (
        <RecipeCreateButton categories={categories}>
          <Button className="w-full sm:w-auto">
            <Plus className="h-4 w-4" />
            Новый рецепт
          </Button>
        </RecipeCreateButton>
      ) : null}
    </header>
  );
}
