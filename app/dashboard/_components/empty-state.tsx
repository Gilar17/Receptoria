import { BookOpenText } from "lucide-react";

type EmptyStateProps = {
  title: string;
  description?: string;
  action?: React.ReactNode;
  showRecipeIcon?: boolean;
};

export function EmptyState({
  title,
  description,
  action,
  showRecipeIcon = false,
}: EmptyStateProps) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
      {showRecipeIcon ? (
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
          <BookOpenText className="h-6 w-6" />
        </div>
      ) : null}
      <p className="text-base font-medium text-slate-800">{title}</p>
      {description ? (
        <p className="mt-2 text-sm text-slate-500">{description}</p>
      ) : null}
      {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
    </div>
  );
}
