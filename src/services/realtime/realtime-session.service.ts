export type CreateRealtimeSessionInput = {
  conversationId: string;
  sceneId?: string;
  level: string;
};

export type RealtimeSessionContract = {
  model: string;
  voice: string;
  clientSecret: string;
  expiresAt: number;
};

export interface RealtimeSessionService {
  create(
    input: CreateRealtimeSessionInput,
  ): Promise<RealtimeSessionContract>;
}
