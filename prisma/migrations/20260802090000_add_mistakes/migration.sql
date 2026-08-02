-- CreateEnum
CREATE TYPE "MistakeCategory" AS ENUM ('GRAMMAR', 'VOCABULARY', 'EXPRESSION');

-- CreateEnum
CREATE TYPE "MistakeStatus" AS ENUM ('LEARNING', 'MASTERED');

-- CreateTable
CREATE TABLE "mistakes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "sceneId" TEXT NOT NULL,
    "original" TEXT NOT NULL,
    "improved" TEXT NOT NULL,
    "reasonZh" TEXT NOT NULL,
    "reasonEn" TEXT NOT NULL,
    "category" "MistakeCategory" NOT NULL DEFAULT 'EXPRESSION',
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "status" "MistakeStatus" NOT NULL DEFAULT 'LEARNING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "mistakes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "mistakes_conversationId_key" ON "mistakes"("conversationId");
CREATE INDEX "mistakes_userId_status_createdAt_idx" ON "mistakes"("userId", "status", "createdAt");
CREATE INDEX "mistakes_sceneId_idx" ON "mistakes"("sceneId");

ALTER TABLE "mistakes" ADD CONSTRAINT "mistakes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "mistakes" ADD CONSTRAINT "mistakes_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "mistakes" ADD CONSTRAINT "mistakes_sceneId_fkey" FOREIGN KEY ("sceneId") REFERENCES "scenes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
