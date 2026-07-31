-- Rename title to content for note text
ALTER TABLE "Note" RENAME COLUMN "title" TO "content";

-- Add updatedAt with default for existing rows
ALTER TABLE "Note" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Indexes for listing by owner and sorting by date
CREATE INDEX "Note_ownerId_idx" ON "Note"("ownerId");
CREATE INDEX "Note_createdAt_idx" ON "Note"("createdAt");
