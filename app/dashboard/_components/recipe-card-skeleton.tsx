export function RecipeCardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex gap-4">
        <div className="h-10 w-10 shrink-0 rounded-xl bg-slate-100" />
        <div className="flex-1 space-y-3">
          <div className="h-4 w-2/3 rounded bg-slate-100" />
          <div className="h-3 w-full rounded bg-slate-100" />
          <div className="h-3 w-4/5 rounded bg-slate-100" />
          <div className="flex gap-2 pt-2">
            <div className="h-8 w-20 rounded-lg bg-slate-100" />
            <div className="h-8 w-8 rounded-lg bg-slate-100" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function RecipeListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <RecipeCardSkeleton key={index} />
      ))}
    </div>
  );
}

export function DashboardHeaderSkeleton() {
  return (
    <div className="mb-6 animate-pulse space-y-3">
      <div className="h-8 w-48 rounded bg-slate-100" />
      <div className="h-5 w-32 rounded bg-slate-100" />
      <div className="h-10 w-full max-w-md rounded-lg bg-slate-100" />
    </div>
  );
}
