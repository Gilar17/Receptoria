-- Поле избранного для личного кабинета (без удаления существующих данных)

ALTER TABLE "Recipe" ADD COLUMN "isFavorite" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "Recipe_isFavorite_idx" ON "Recipe"("isFavorite");

CREATE INDEX "Recipe_ownerId_createdAt_idx" ON "Recipe"("ownerId", "createdAt");
