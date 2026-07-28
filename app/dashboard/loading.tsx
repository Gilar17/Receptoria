import {
  DashboardHeaderSkeleton,
  RecipeListSkeleton,
} from "@/app/dashboard/_components/recipe-card-skeleton";

export default function DashboardLoading() {
  return (
    <>
      <DashboardHeaderSkeleton />
      <div className="mb-6 h-10 max-w-xl animate-pulse rounded-lg bg-slate-100" />
      <RecipeListSkeleton count={5} />
    </>
  );
}
