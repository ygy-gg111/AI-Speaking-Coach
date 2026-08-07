"use client";

import {
  ArrowLeftOutlined,
  ReloadOutlined,
  ShareAltOutlined,
} from "@ant-design/icons";
import { Button, Empty, Spin } from "antd";
import { useTranslations } from "next-intl";
import { useParams, useSearchParams } from "next/navigation";

import { CoachEvaluationPanel } from "@/features/correction/components/coach-evaluation-panel";
import { useConversationReview } from "@/features/correction/hooks/use-conversation-review";
import { useSceneCatalog } from "@/features/scenes/hooks/use-scene-catalog";
import { Link } from "@/i18n/navigation";

import styles from "./review.module.css";

export default function PracticeReviewPage() {
  const t = useTranslations("Evaluation");
  const params = useParams<{ conversationId: string }>();
  const searchParams = useSearchParams();
  const conversationId = params.conversationId;
  const sceneIdentifier = searchParams.get("scene") ?? "";
  const scenes = useSceneCatalog().data ?? [];
  const scene = scenes.find(
    (item) => item.id === sceneIdentifier || item.slug === sceneIdentifier,
  );
  const { error, isAnalyzing, review } = useConversationReview({
    conversationId,
    sceneName: scene?.title.en ?? sceneIdentifier,
    learnerLevel: "A2",
  });
  const practiceHref =
    `/practice/${conversationId}?scene=${encodeURIComponent(scene?.slug ?? sceneIdentifier)}` as const;

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
        {review ? (
          <CoachEvaluationPanel
            evaluation={review.evaluation}
            analysisStatus={review.source === "ai" ? "ready" : "fallback"}
          />
        ) : isAnalyzing ? (
          <Spin size="large" />
        ) : (
          <Empty description={error ? t("analysis.error") : t("analysis.loading")} />
        )}
        <Link href={practiceHref} className={styles.retry}>
          <Button type="primary" size="large" icon={<ReloadOutlined />} block>
            {t("retryScene")}
          </Button>
        </Link>
        <Link
          href={`/practice/${conversationId}/share?scene=${encodeURIComponent(scene?.slug ?? sceneIdentifier)}`}
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
