import type { ReactNode } from "react";

import styles from "./metric-card.module.css";

type MetricCardProps = {
  icon: ReactNode;
  label: string;
  value: string | number;
  unit: string;
  detail: ReactNode;
  progress?: number;
  tone: "purple" | "blue" | "red";
};

export function MetricCard({
  icon,
  label,
  value,
  unit,
  detail,
  progress,
  tone,
}: MetricCardProps) {
  return (
    <article className={styles.card} data-tone={tone}>
      <div className={styles.label}>
        <span className={styles.icon}>{icon}</span>
        {label}
      </div>
      <strong>
        {value} <small>{unit}</small>
      </strong>
      <div className={styles.detail}>{detail}</div>
      {progress !== undefined && (
        <div className={styles.track}>
          <i style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} />
        </div>
      )}
    </article>
  );
}
