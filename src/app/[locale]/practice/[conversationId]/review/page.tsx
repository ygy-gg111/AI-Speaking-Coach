"use client";

import {
  ArrowLeftOutlined,
  ReloadOutlined,
  ShareAltOutlined,
} from "@ant-design/icons";
import { Button } from "antd";
import { useTranslations } from "next-intl";
import { useParams, useSearchParams } from "next/navigation";

import { CoachEvaluationPanel } from "@/features/correction/components/coach-evaluation-panel";
import { useConversationReview } from "@/features/correction/hooks/use-conversation-review";
import { mockEvaluation } from "@/features/conversation/mock-conversation";
import { findScene, mockScenes } from "@/features/scenes/mock-scenes";
import { Link } from "@/i18n/navigation";

import styles from "./review.module.css";

export default function PracticeReviewPage() {
  const t = useTranslations("Evaluation");
  const params = useParams<{ conversationId: string }>();
  const searchParams = useSearchParams();
  const conversationId = params.conversationId;
  const scene = findScene(searchParams.get("scene") ?? "") ?? mockScenes[1];
  const { review } = useConversationReview({
    conversationId,
    sceneName: scene.title.en,
    learnerLevel: "A2",
  });
  const practiceHref =
    `/practice/${conversationId}?scene=${encodeURIComponent(scene.slug)}` as const;

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
        <Link
          href={`/practice/${conversationId}/share?scene=${scene.slug}`}
          className={styles.retry}
        >
          <Button size="large" icon={<ShareAltOutlined />} block>
            {t("share")}
          </Button>
        </Link>
      </div>
    </main>
  );
}
