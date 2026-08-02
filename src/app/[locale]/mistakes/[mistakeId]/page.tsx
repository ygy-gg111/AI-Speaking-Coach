"use client";

import {
  ArrowLeftOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  ReloadOutlined,
} from "@ant-design/icons";
import { Button, Empty, Tag } from "antd";
import { useLocale, useTranslations } from "next-intl";
import { useParams } from "next/navigation";

import { mockScenes } from "@/features/scenes/mock-scenes";
import {
  useCloudMistakes,
  useReviewMistake,
} from "@/features/mistakes/hooks/use-cloud-mistakes";
import { Link } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { useLearningStore } from "@/stores/learning-store";

import styles from "../../feature-pages.module.css";

export default function MistakeDetailPage() {
  const locale = useLocale() as AppLocale;
  const t = useTranslations("MistakeDetail");
  const params = useParams<{ mistakeId: string }>();
  useCloudMistakes();
  const mistake = useLearningStore((store) =>
    store.mistakes.find((item) => item.id === params.mistakeId),
  );
  const reviewMistake = useReviewMistake();

  if (!mistake) {
    return (
      <main className={styles.page}>
        <Empty description={t("notFound")}>
          <Link href="/mistakes">
            <Button>{t("back")}</Button>
          </Link>
        </Empty>
      </main>
    );
  }

  const scene = mockScenes.find((item) => item.id === mistake.sceneId);
  const related = [
    mistake.improved.replace("I ", "We "),
    `Could you say: “${mistake.improved}”?`,
  ];

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <Link href="/mistakes">
            <Button type="text" icon={<ArrowLeftOutlined />}>
              {t("back")}
            </Button>
          </Link>
          <span>{t("eyebrow")}</span>
          <h1>{t("title")}</h1>
          <p>{scene?.title[locale] ?? t("unknownScene")}</p>
        </div>
        <Tag color={mistake.status === "mastered" ? "green" : "purple"}>
          {t(`status.${mistake.status}`)}
        </Tag>
      </header>

      <div className={styles.grid}>
        <section className={styles.card}>
          <span className={styles.eyebrow}>{t("comparison")}</span>
          <div className={styles.list}>
            <article className={styles.listItem}>
              <div>
                <span className={styles.muted}>
                  <CloseCircleFilled /> {t("original")}
                </span>
                <h2 className={styles.phrase}>{mistake.original}</h2>
              </div>
            </article>
            <article className={styles.listItem}>
              <div>
                <span className={styles.muted}>
                  <CheckCircleFilled /> {t("improved")}
                </span>
                <h2 className={styles.phrase}>{mistake.improved}</h2>
              </div>
            </article>
          </div>
        </section>
        <section className={styles.card}>
          <span className={styles.eyebrow}>{t("reason")}</span>
          <h2>{t("why")}</h2>
          <p>{mistake.reason[locale]}</p>
          <p className={styles.muted}>
            {t("reviewCount", { count: mistake.reviewCount })}
          </p>
        </section>
      </div>

      <section className={styles.card} style={{ marginTop: 20 }}>
        <span className={styles.eyebrow}>{t("similar")}</span>
        <h2>{t("similarTitle")}</h2>
        <div className={styles.list}>
          {related.map((expression) => (
            <article className={styles.listItem} key={expression}>
              <span className={styles.phrase}>{expression}</span>
              <Button>{t("answerAgain")}</Button>
            </article>
          ))}
        </div>
        <div className={styles.actions}>
          <Button
            icon={<CheckCircleFilled />}
            disabled={mistake.status === "mastered"}
            onClick={() => reviewMistake(mistake.id)}
          >
            {t("reviewed")}
          </Button>
          <Link href={`/practice/${mistake.conversationId}?scene=${scene?.slug ?? ""}`}>
            <Button type="primary" icon={<ReloadOutlined />}>
              {t("practiceAgain")}
            </Button>
          </Link>
        </div>
      </section>
    </main>
  );
}
