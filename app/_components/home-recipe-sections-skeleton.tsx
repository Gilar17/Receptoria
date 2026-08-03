export function HomeRecipeSectionsSkeleton() {
  return (
    <div className="space-y-12">
      {[0, 1].map((section) => (
        <section key={section} className="space-y-5">
          <div className="h-8 w-48 animate-pulse rounded-lg bg-slate-200" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-56 animate-pulse rounded-xl border border-slate-200 bg-white"
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
