import { RightOutlined } from "@ant-design/icons";

import { SceneCover } from "@/features/scenes/components/scene-cover";
import type { Scene } from "@/features/scenes/types";

import styles from "./practice-record.module.css";

type PracticeRecordProps = {
  scene: Scene;
  title: string;
  duration: string;
  expressions: string;
  corrections: string;
  time: string;
};

export function PracticeRecord({
  scene,
  title,
  duration,
  expressions,
  corrections,
  time,
}: PracticeRecordProps) {
  return (
    <article className={styles.record}>
      <SceneCover
        compact
        label={title}
        mark={scene.coverMark}
        tone={scene.coverTone}
      />
      <div className={styles.primary}>
        <strong>{title}</strong>
        <span>{duration}</span>
      </div>
      <div className={styles.stats}>
        <span>{expressions}</span>
        <span>{corrections}</span>
      </div>
      <time>{time}</time>
      <RightOutlined className={styles.arrow} />
    </article>
  );
}
