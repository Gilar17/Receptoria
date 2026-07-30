"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CategoryOption } from "@/lib/recipes/queries";

type RecipeCategoryFilterProps = {
  categories: CategoryOption[];
};

export function RecipeCategoryFilter({ categories }: RecipeCategoryFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const category = searchParams.get("category")?.trim() || undefined;

  const handleChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (value === "all") {
      params.delete("category");
    } else {
      params.set("category", value);
    }

    params.set("page", "1");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  };

  return (
    <Select value={category ?? "all"} onValueChange={handleChange}>
      <SelectTrigger className="w-full sm:w-[200px]" aria-label="Фильтр по категории">
        <SelectValue placeholder="Все категории" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Все категории</SelectItem>
        {categories.map((item) => (
          <SelectItem key={item.id} value={item.id}>
            {item.category}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
