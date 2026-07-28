import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashboardMobileMenu } from "@/app/dashboard/_components/dashboard-mobile-menu";
import { RecipeCreateButton } from "@/app/dashboard/_components/recipe-create-button";

type DashboardHeaderProps = {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  sectionTitle: string;
  showCreate?: boolean;
};

export function DashboardHeader({
  user,
  sectionTitle,
  showCreate = false,
}: DashboardHeaderProps) {
  return (
    <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex items-start gap-3">
        <DashboardMobileMenu user={user} />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Личный кабинет
          </h1>
          <h2 className="mt-1 text-lg text-slate-600">{sectionTitle}</h2>
        </div>
      </div>
      {showCreate ? (
        <RecipeCreateButton>
          <Button className="w-full sm:w-auto">
            <Plus className="h-4 w-4" />
            Новый рецепт
          </Button>
        </RecipeCreateButton>
      ) : null}
    </header>
  );
}
