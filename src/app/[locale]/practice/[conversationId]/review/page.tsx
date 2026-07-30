"use client";

import { ArrowLeftOutlined, ReloadOutlined } from "@ant-design/icons";
import { Button } from "antd";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";

import { CoachEvaluationPanel } from "@/features/correction/components/coach-evaluation-panel";
import { useConversationReview } from "@/features/correction/hooks/use-conversation-review";
import { mockEvaluation } from "@/features/conversation/mock-conversation";
import { Link } from "@/i18n/navigation";

import styles from "./review.module.css";

export default function PracticeReviewPage() {
  const t = useTranslations("Evaluation");
  const params = useParams<{ conversationId: string }>();
  const conversationId = params.conversationId;
  const { review } = useConversationReview({
    conversationId,
    sceneName: "Airport Check-in",
    learnerLevel: "A2",
  });
  const practiceHref = `/practice/${conversationId}` as const;

  return (
    <main className={styles.page}>
      <header>
        <Link href={practiceHref}>
          <Button type="text" icon={<ArrowLeftOutlined />}>
            {t("backToPractice")}
          </Button>
        </Link>
        <div>
          <span>AI Speaking Coach</span>
          <h1>{t("reviewTitle")}</h1>
          <p>{t("reviewSubtitle")}</p>
        </div>
      </header>

      <div className={styles.content}>
        <CoachEvaluationPanel
          evaluation={review?.evaluation ?? mockEvaluation}
          analysisStatus={
            review?.source === "ai"
              ? "ready"
              : review?.source === "fallback"
                ? "fallback"
                : "idle"
          }
        />
        <Link href={practiceHref} className={styles.retry}>
          <Button type="primary" size="large" icon={<ReloadOutlined />} block>
            {t("retryScene")}
          </Button>
        </Link>
      </div>
    </main>
  );
}
