import type { PrismaClient } from "@prisma/client";

import type { SceneRecord } from "./scene.repository";

export interface FavoriteSceneRepository {
  list(userId: string): Promise<SceneRecord[]>;
  add(userId: string, sceneId: string): Promise<void>;
  remove(userId: string, sceneId: string): Promise<void>;
}

export class PrismaFavoriteSceneRepository
  implements FavoriteSceneRepository
{
  constructor(private readonly prisma: PrismaClient) {}

  async list(userId: string) {
    const favorites = await this.prisma.favoriteScene.findMany({
      where: { userId, scene: { isActive: true } },
      orderBy: { createdAt: "desc" },
      select: { scene: { select: favoriteSceneSelect } },
    });
    return favorites.map((favorite) => favorite.scene);
  }

  async add(userId: string, sceneId: string) {
    await this.prisma.favoriteScene.upsert({
      where: { userId_sceneId: { userId, sceneId } },
      update: {},
      create: { userId, sceneId },
    });
  }

  async remove(userId: string, sceneId: string) {
    await this.prisma.favoriteScene.deleteMany({
      where: { userId, sceneId },
    });
  }
}

const favoriteSceneSelect = {
  id: true,
  slug: true,
  titleKey: true,
  descriptionKey: true,
  systemPrompt: true,
  category: true,
  coverTone: true,
  coverMark: true,
  difficulty: true,
  estimatedMinutes: true,
  lessonCount: true,
  content: true,
  sortOrder: true,
} as const;
