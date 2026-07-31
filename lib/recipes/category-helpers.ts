import type { PrismaClient } from "@prisma/client";
import type { CategoryOption } from "@/lib/recipes/queries";
import { PRIMARY_CATEGORY_NAMES } from "@/lib/recipes/constants";

export function categoryNamesEqual(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

export function sortCategoryOptions(
  categories: CategoryOption[],
): CategoryOption[] {
  const primaryOrder = new Map(
    PRIMARY_CATEGORY_NAMES.map((name, index) => [name.toLowerCase(), index]),
  );

  return [...categories].sort((a, b) => {
    const aKey = a.category.trim().toLowerCase();
    const bKey = b.category.trim().toLowerCase();
    const aPrimary = primaryOrder.get(aKey);
    const bPrimary = primaryOrder.get(bKey);

    if (aPrimary !== undefined && bPrimary !== undefined) {
      return aPrimary - bPrimary;
    }
    if (aPrimary !== undefined) return -1;
    if (bPrimary !== undefined) return 1;
    return a.category.localeCompare(b.category, "ru");
  });
}

export async function findCategoryByNameCaseInsensitive(
  prisma: Pick<PrismaClient, "category">,
  name: string,
) {
  const trimmed = name.trim();
  if (!trimmed) return null;

  return prisma.category.findFirst({
    where: {
      category: { equals: trimmed, mode: "insensitive" },
    },
  });
}
