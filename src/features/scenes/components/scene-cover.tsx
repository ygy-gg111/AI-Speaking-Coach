import type { SceneCoverTone } from "../types";

import styles from "./scene-cover.module.css";

type SceneCoverProps = {
  label: string;
  mark: string;
  tone: SceneCoverTone;
  compact?: boolean;
};

export function SceneCover({
  label,
  mark,
  tone,
  compact = false,
}: SceneCoverProps) {
  return (
    <div
      className={`${styles.cover} ${compact ? styles.compact : ""}`}
      data-tone={tone}
      role="img"
      aria-label={label}
    >
      <span className={styles.mark}>{mark}</span>
      <i className={styles.orbOne} />
      <i className={styles.orbTwo} />
    </div>
  );
}
