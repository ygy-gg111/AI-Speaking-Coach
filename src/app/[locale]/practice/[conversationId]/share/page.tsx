"use client";

import {
  ArrowLeftOutlined,
  CheckOutlined,
  CopyOutlined,
} from "@ant-design/icons";
import { Button, Input, message } from "antd";
import { useQuery } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { useParams, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

import { getConversation, isGuestConversation } from "@/features/conversation/conversation-client";
import { useConversationReview } from "@/features/correction/hooks/use-conversation-review";
import { useSceneCatalog } from "@/features/scenes/hooks/use-scene-catalog";
import { Link } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { useLearningStore } from "@/stores/learning-store";

import styles from "../../../feature-pages.module.css";

export default function SharePracticePage() {
  const locale = useLocale() as AppLocale;
  const t = useTranslations("Share");
  const params = useParams<{ conversationId: string }>();
  const searchParams = useSearchParams();
  const sceneIdentifier = searchParams.get("scene") ?? "";
  const scenes = useSceneCatalog().data ?? [];
  const scene = scenes.find(
    (item) => item.id === sceneIdentifier || item.slug === sceneIdentifier,
  );
  const conversationQuery = useQuery({
    queryKey: ["conversation", params.conversationId],
    queryFn: () => getConversation(params.conversationId),
    enabled: !isGuestConversation(params.conversationId),
    retry: false,
  });
  const { review } = useConversationReview({
    conversationId: params.conversationId,
    sceneName: scene?.title.en ?? sceneIdentifier,
    learnerLevel: "A2",
  });
  const record = useLearningStore((store) =>
    store.records.find(
      (item) => item.conversationId === params.conversationId,
    ),
  );
  const [reflection, setReflection] = useState(t("defaultReflection"));
  const [copied, setCopied] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const minutes = conversationQuery.data?.durationSeconds
    ? Math.max(1, Math.round(conversationQuery.data.durationSeconds / 60))
    : record?.durationMinutes ?? 0;
  const expression = review?.evaluation.improved ??
    conversationQuery.data?.summary ?? "";
  const sceneTitle = scene?.title[locale] ?? sceneIdentifier;
  const copy = useMemo(
    () =>
      t("copyTemplate", {
        scene: sceneTitle,
        minutes,
        expression,
        reflection,
      }),
    [expression, minutes, reflection, sceneTitle, t],
  );

  async function copyText() {
    await navigator.clipboard.writeText(copy);
    setCopied(true);
    void messageApi.success(t("copied"));
  }

  return (
    <main className={styles.page}>
      {contextHolder}
      <header className={styles.header}>
        <div>
          <Link
            href={`/practice/${params.conversationId}/review?scene=${encodeURIComponent(scene?.slug ?? sceneIdentifier)}`}
          >
            <Button type="text" icon={<ArrowLeftOutlined />}>
              {t("back")}
            </Button>
          </Link>
          <span>{t("eyebrow")}</span>
          <h1>{t("title")}</h1>
          <p>{t("subtitle")}</p>
        </div>
      </header>

      <div className={styles.grid}>
        <section>
          <div className={styles.poster}>
            <span>DAY 15 · AI SPEAKING</span>
            <h2>{sceneTitle}</h2>
            <p>{t("minutes", { count: minutes })}</p>
            <blockquote>“{expression}”</blockquote>
            <footer>{reflection}</footer>
          </div>
        </section>
        <section className={styles.card}>
          <span className={styles.eyebrow}>{t("copyTitle")}</span>
          <h2>{t("editTitle")}</h2>
          <Input.TextArea
            value={reflection}
            onChange={(event) => setReflection(event.target.value)}
            autoSize={{ minRows: 3, maxRows: 6 }}
          />
          <div className={styles.textPreview}>{copy}</div>
          <Button
            type="primary"
            block
            icon={copied ? <CheckOutlined /> : <CopyOutlined />}
            onClick={() => void copyText()}
          >
            {copied ? t("copied") : t("copy")}
          </Button>
        </section>
      </div>
    </main>
  );
}
