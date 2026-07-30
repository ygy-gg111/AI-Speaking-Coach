"use client";

import {
  ArrowLeftOutlined,
  CheckOutlined,
  CopyOutlined,
} from "@ant-design/icons";
import { Button, Input, message } from "antd";
import { useLocale, useTranslations } from "next-intl";
import { useParams, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

import { findScene, mockScenes } from "@/features/scenes/mock-scenes";
import { Link } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { useLearningStore } from "@/stores/learning-store";

import styles from "../../../feature-pages.module.css";

export default function SharePracticePage() {
  const locale = useLocale() as AppLocale;
  const t = useTranslations("Share");
  const params = useParams<{ conversationId: string }>();
  const searchParams = useSearchParams();
  const scene = findScene(searchParams.get("scene") ?? "") ?? mockScenes[0];
  const record = useLearningStore((store) =>
    store.records.find(
      (item) => item.conversationId === params.conversationId,
    ),
  );
  const [reflection, setReflection] = useState(t("defaultReflection"));
  const [copied, setCopied] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const copy = useMemo(
    () =>
      t("copyTemplate", {
        scene: scene.title[locale],
        minutes: record?.durationMinutes ?? 10,
        expression: "Could I have an aisle seat?",
        reflection,
      }),
    [locale, record?.durationMinutes, reflection, scene.title, t],
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
            href={`/practice/${params.conversationId}/review?scene=${scene.slug}`}
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
            <h2>{scene.title[locale]}</h2>
            <p>{t("minutes", { count: record?.durationMinutes ?? 10 })}</p>
            <blockquote>“Could I have an aisle seat?”</blockquote>
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
