import { RecipeVisibility } from "@prisma/client";

/** visibility (существующее поле) ↔ isPublic (UI) */
export function isPublicVisibility(visibility: RecipeVisibility): boolean {
  return visibility === RecipeVisibility.PUBLIC;
}

export function visibilityFromIsPublic(isPublic: boolean): RecipeVisibility {
  return isPublic ? RecipeVisibility.PUBLIC : RecipeVisibility.PRIVATE;
}

export function parsePageParam(raw: string | undefined): number {
  const parsed = Number.parseInt(raw ?? "1", 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return 1;
  }
  return parsed;
}

export function parseSearchQuery(raw: string | undefined): string {
  return raw?.trim() ?? "";
}

export function buildSearchWhere(q: string) {
  if (!q) {
    return undefined;
  }

  return {
    OR: [
      { title: { contains: q, mode: "insensitive" as const } },
      { content: { contains: q, mode: "insensitive" as const } },
    ],
  };
}

export function normalizePageAfterDelete(
  currentPage: number,
  totalItems: number,
  pageSize: number,
): number {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  return Math.min(currentPage, totalPages);
}
