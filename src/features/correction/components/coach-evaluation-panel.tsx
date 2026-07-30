"use client";

import {
  CheckCircleFilled,
  CloseCircleFilled,
  HeartFilled,
  HeartOutlined,
  ReloadOutlined,
  StarFilled,
  StarOutlined,
  ThunderboltFilled,
} from "@ant-design/icons";
import { Button } from "antd";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import type { AppLocale } from "@/i18n/routing";
import type { ConversationEvaluation } from "@/features/conversation/types";
import { SessionLearningStats } from "@/features/learning/components/session-learning-stats";

import styles from "./coach-evaluation-panel.module.css";

type CoachEvaluationPanelProps = {
  evaluation: ConversationEvaluation;
  showStats?: boolean;
  onRetry?: () => void;
};

export function CoachEvaluationPanel({
  evaluation,
  showStats = true,
  onRetry,
}: CoachEvaluationPanelProps) {
  const locale = useLocale() as AppLocale;
  const t = useTranslations("Evaluation");
  const [favorite, setFavorite] = useState(false);

  return (
    <aside className={styles.wrapper}>
      <section className={styles.panel}>
        <header>
          <span className={styles.coachIcon}>
            <ThunderboltFilled />
          </span>
          <h2>{t("title")}</h2>
        </header>

        <div className={styles.expression}>
          <span>{t("yourExpression")}</span>
          <p className={styles.original}>
            <CloseCircleFilled /> {evaluation.original}
          </p>
        </div>

        <div className={styles.expression}>
          <span>{t("naturalExpression")}</span>
          <p className={styles.improved}>
            <CheckCircleFilled /> {evaluation.improved}
          </p>
        </div>

        <div className={styles.reason}>
          <span>{t("reason")}</span>
          <p>{evaluation.reason[locale]}</p>
        </div>

        <div className={styles.difficulty}>
          <span>{t("difficulty")}</span>
          <div aria-label={t("difficultyValue", { value: evaluation.difficulty })}>
            {[1, 2, 3, 4, 5].map((value) =>
              value <= evaluation.difficulty ? (
                <StarFilled key={value} />
              ) : (
                <StarOutlined key={value} />
              ),
            )}
          </div>
        </div>

        <footer>
          <Button
            type="text"
            icon={favorite ? <HeartFilled /> : <HeartOutlined />}
            onClick={() => setFavorite((current) => !current)}
          >
            {favorite ? t("favorited") : t("favorite")}
          </Button>
          <Button type="text" icon={<ReloadOutlined />} onClick={onRetry}>
            {t("retry")}
          </Button>
        </footer>
      </section>

      {showStats && <SessionLearningStats evaluation={evaluation} />}
    </aside>
  );
}
