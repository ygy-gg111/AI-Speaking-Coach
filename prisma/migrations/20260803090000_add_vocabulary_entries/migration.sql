-- CreateTable
CREATE TABLE "vocabulary_entries" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "sceneId" TEXT NOT NULL,
    "phrase" TEXT NOT NULL,
    "meaningZh" TEXT NOT NULL,
    "meaningEn" TEXT NOT NULL,
    "example" TEXT NOT NULL,
    "favorite" BOOLEAN NOT NULL DEFAULT false,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "vocabulary_entries_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "vocabulary_entries_userId_phrase_key" ON "vocabulary_entries"("userId", "phrase");
CREATE INDEX "vocabulary_entries_userId_favorite_createdAt_idx" ON "vocabulary_entries"("userId", "favorite", "createdAt");
CREATE INDEX "vocabulary_entries_sceneId_idx" ON "vocabulary_entries"("sceneId");

ALTER TABLE "vocabulary_entries" ADD CONSTRAINT "vocabulary_entries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "vocabulary_entries" ADD CONSTRAINT "vocabulary_entries_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "vocabulary_entries" ADD CONSTRAINT "vocabulary_entries_sceneId_fkey" FOREIGN KEY ("sceneId") REFERENCES "scenes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
