export type ConversationSummary = {
  id: string;
  sceneId: string | null;
  startedAt: Date;
  endedAt: Date | null;
};

export interface ConversationRepository {
  findByUserId(userId: string): Promise<ConversationSummary[]>;
  findById(id: string): Promise<ConversationSummary | null>;
}
