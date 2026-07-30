"use client";

import { useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type RecipeSearchProps = {
  placeholder?: string;
  className?: string;
};

export function RecipeSearch({
  placeholder = "Поиск по рецептам",
  className,
}: RecipeSearchProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get("q") ?? "";
  const debounceRef = useRef<number | null>(null);

  const scheduleSearch = (nextValue: string) => {
    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
    }

    debounceRef.current = window.setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());

      if (nextValue.trim()) {
        params.set("q", nextValue.trim());
      } else {
        params.delete("q");
      }

      params.set("page", "1");
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname);
    }, 300);
  };

  return (
    <div className={cn("relative max-w-xl flex-1", className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <Input
        key={`${pathname}:${urlQuery}`}
        defaultValue={urlQuery}
        onChange={(event) => scheduleSearch(event.target.value)}
        placeholder={placeholder}
        className="pl-10"
        aria-label={placeholder}
      />
    </div>
  );
}
