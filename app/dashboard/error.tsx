"use client";

import { Button } from "@/components/ui/button";

export default function DashboardError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
      <h2 className="text-lg font-semibold text-red-900">
        Не удалось загрузить личный кабинет
      </h2>
      <p className="mt-2 text-sm text-red-700">
        Попробуйте обновить страницу или повторить попытку позже.
      </p>
      <Button className="mt-6" onClick={reset}>
        Повторить
      </Button>
    </div>
  );
}
