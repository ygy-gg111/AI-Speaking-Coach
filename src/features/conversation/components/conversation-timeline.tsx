import type { ConversationMessage } from "../types";
import { MessageBubble } from "./message-bubble";
import styles from "./conversation-timeline.module.css";

type ConversationTimelineProps = {
  messages: ConversationMessage[];
  thinkingLabel?: string;
};

export function ConversationTimeline({
  messages,
  thinkingLabel,
}: ConversationTimelineProps) {
  return (
    <section className={styles.timeline} aria-live="polite">
      {messages.map((message) => (
        <MessageBubble message={message} key={message.id} />
      ))}
      {thinkingLabel && (
        <div className={styles.thinking}>
          <i />
          <i />
          <i />
          <span>{thinkingLabel}</span>
        </div>
      )}
    </section>
  );
}
