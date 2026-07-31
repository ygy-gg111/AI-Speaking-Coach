import type { PrismaClient } from "@prisma/client";

export type SceneFilters = {
  category?: string;
  difficulty?: number;
  query?: string;
};

export type SceneRecord = {
  id: string;
  slug: string;
  titleKey: string;
  descriptionKey: string;
  systemPrompt: string;
  category: string;
  coverTone: string;
  coverMark: string;
  difficulty: number;
  estimatedMinutes: number;
  lessonCount: number;
  content: unknown;
  sortOrder: number;
};

export interface SceneRepository {
  list(filters: SceneFilters): Promise<SceneRecord[]>;
  findActiveByIdentifier(identifier: string): Promise<SceneRecord | null>;
}

export class PrismaSceneRepository implements SceneRepository {
  constructor(private readonly prisma: PrismaClient) {}

  list(filters: SceneFilters) {
    return this.prisma.scene.findMany({
      where: {
        isActive: true,
        category: filters.category,
        difficulty: filters.difficulty,
        ...(filters.query
          ? {
              OR: [
                {
                  slug: {
                    contains: filters.query,
                    mode: "insensitive" as const,
                  },
                },
                {
                  searchText: {
                    contains: filters.query,
                    mode: "insensitive" as const,
                  },
                },
              ],
            }
          : {}),
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      select: sceneSelect,
    });
  }

  findActiveByIdentifier(identifier: string) {
    return this.prisma.scene.findFirst({
      where: {
        isActive: true,
        OR: [{ id: identifier }, { slug: identifier }],
      },
      select: sceneSelect,
    });
  }
}

const sceneSelect = {
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
