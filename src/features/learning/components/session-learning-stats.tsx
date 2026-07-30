import {
  BookOutlined,
  ClockCircleOutlined,
  FormOutlined,
} from "@ant-design/icons";
import { useTranslations } from "next-intl";

import type { ConversationEvaluation } from "@/features/conversation/types";

import styles from "./session-learning-stats.module.css";

type SessionLearningStatsProps = {
  evaluation: ConversationEvaluation;
};

export function SessionLearningStats({
  evaluation,
}: SessionLearningStatsProps) {
  const t = useTranslations("Evaluation");
  const items = [
    {
      icon: BookOutlined,
      label: t("newExpressions"),
      value: t("expressionCount", { count: evaluation.newExpressions }),
    },
    {
      icon: FormOutlined,
      label: t("corrections"),
      value: t("correctionCount", { count: evaluation.corrections }),
    },
    {
      icon: ClockCircleOutlined,
      label: t("duration"),
      value: t("minuteCount", { count: evaluation.durationMinutes }),
    },
  ];

  return (
    <section className={styles.stats}>
      <h2>{t("sessionStats")}</h2>
      <div>
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <article key={item.label}>
              <span>
                <Icon />
                {item.label}
              </span>
              <strong>{item.value}</strong>
            </article>
          );
        })}
      </div>
    </section>
  );
}
