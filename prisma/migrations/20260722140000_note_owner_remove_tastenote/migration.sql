-- Шаг 1: создать Default User, если пользователя с email default@example.com ещё нет
INSERT INTO "User" ("id", "email", "name", "createdAt")
SELECT
  'default-user-migration',
  'default@example.com',
  'Default User',
  CURRENT_TIMESTAMP
WHERE NOT EXISTS (
  SELECT 1 FROM "User" WHERE "email" = 'default@example.com'
);

-- Шаг 2: добавить ownerId в Note как nullable
ALTER TABLE "Note" ADD COLUMN "ownerId" TEXT;

-- Шаг 3: заполнить ownerId у всех существующих Note
UPDATE "Note"
SET "ownerId" = (
  SELECT "id" FROM "User" WHERE "email" = 'default@example.com' LIMIT 1
)
WHERE "ownerId" IS NULL;

-- Шаг 4: сделать ownerId обязательным
ALTER TABLE "Note" ALTER COLUMN "ownerId" SET NOT NULL;

-- Шаг 5: создать внешний ключ Note.ownerId -> User.id
ALTER TABLE "Note"
ADD CONSTRAINT "Note_ownerId_fkey"
FOREIGN KEY ("ownerId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- Шаг 6: удалить TasteNote только если таблица пустая
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "TasteNote" LIMIT 1) THEN
    RAISE EXCEPTION 'Migration aborted: TasteNote is not empty';
  END IF;

  ALTER TABLE "TasteNote" DROP CONSTRAINT IF EXISTS "TasteNote_ownerId_fkey";
  DROP TABLE "TasteNote";
END $$;
