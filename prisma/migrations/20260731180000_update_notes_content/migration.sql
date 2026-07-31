-- Rename title to content (идемпотентно)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Note' AND column_name = 'title'
  ) THEN
    ALTER TABLE "Note" RENAME COLUMN "title" TO "content";
  END IF;
END $$;

-- Add updatedAt for existing rows
ALTER TABLE "Note" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Indexes
CREATE INDEX IF NOT EXISTS "Note_ownerId_idx" ON "Note"("ownerId");
CREATE INDEX IF NOT EXISTS "Note_createdAt_idx" ON "Note"("createdAt");
