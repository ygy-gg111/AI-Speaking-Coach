CREATE TABLE "favorite_scenes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sceneId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorite_scenes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "favorite_scenes_userId_sceneId_key"
ON "favorite_scenes"("userId", "sceneId");

CREATE INDEX "favorite_scenes_userId_createdAt_idx"
ON "favorite_scenes"("userId", "createdAt");

ALTER TABLE "favorite_scenes"
ADD CONSTRAINT "favorite_scenes_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "favorite_scenes"
ADD CONSTRAINT "favorite_scenes_sceneId_fkey"
FOREIGN KEY ("sceneId") REFERENCES "scenes"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
