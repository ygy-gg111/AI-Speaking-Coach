"use client";

import { ArrowRightOutlined } from "@ant-design/icons";
import { Button, Empty, Progress, Tabs } from "antd";
import { useLocale, useTranslations } from "next-intl";
import { useMemo } from "react";

import { getSceneMastery } from "@/features/learning/learning-data";
import { SceneCard } from "@/features/scenes/components/scene-card";
import { SceneCover } from "@/features/scenes/components/scene-cover";
import { mockScenes } from "@/features/scenes/mock-scenes";
import { Link } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { useLearningStore } from "@/stores/learning-store";

import styles from "./my-scenes.module.css";

export default function MyScenesPage() {
  const locale = useLocale() as AppLocale;
  const t = useTranslations("MyScenes");
  const favoriteSceneIds = useLearningStore(
    (store) => store.favoriteSceneIds,
  );
  const records = useLearningStore((store) => store.records);
  const favoriteScenes = mockScenes.filter((scene) =>
    favoriteSceneIds.includes(scene.id),
  );
  const sortedRecords = useMemo(
    () =>
      [...records].sort(
        (left, right) =>
          new Date(right.completedAt).getTime() -
          new Date(left.completedAt).getTime(),
      ),
    [records],
  );
  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    [locale],
  );

  const savedContent = favoriteScenes.length ? (
    <div className={styles.savedGrid}>
      {favoriteScenes.map((scene) => (
        <SceneCard key={scene.id} scene={scene} />
      ))}
    </div>
  ) : (
    <Empty
      image={Empty.PRESENTED_IMAGE_SIMPLE}
      description={t("emptyFavorites")}
    >
      <Link href="/scenes">
        <Button type="primary">{t("browseScenes")}</Button>
      </Link>
    </Empty>
  );

  const historyContent = sortedRecords.length ? (
    <div className={styles.historyList}>
      {sortedRecords.map((record) => {
        const scene =
          mockScenes.find((item) => item.id === record.sceneId) ?? mockScenes[0];
        const mastery = getSceneMastery(records, scene.id);
        return (
          <article className={styles.historyItem} key={record.id}>
            <SceneCover
              compact
              label={scene.title[locale]}
              mark={scene.coverMark}
              tone={scene.coverTone}
            />
            <div className={styles.historyPrimary}>
              <strong>{scene.title[locale]}</strong>
              <time>{dateFormatter.format(new Date(record.completedAt))}</time>
              <div className={styles.recordStats}>
                <span>
                  {t("duration", { count: record.durationMinutes })}
                </span>
                <span>
                  {t("expressions", { count: record.newExpressions })}
                </span>
                <span>{t("corrections", { count: record.corrections })}</span>
              </div>
            </div>
            <div className={styles.mastery}>
              <span>{t("mastery")}</span>
              <Progress
                percent={mastery}
                size="small"
                strokeColor="#7157f5"
                aria-label={t("masteryValue", { value: mastery })}
              />
            </div>
            <Link
              href={`/practice/${record.conversationId}/review`}
              className={styles.reviewLink}
              aria-label={t("viewReview", { title: scene.title[locale] })}
            >
              <ArrowRightOutlined />
            </Link>
          </article>
        );
      })}
    </div>
  ) : (
    <Empty
      image={Empty.PRESENTED_IMAGE_SIMPLE}
      description={t("emptyHistory")}
    />
  );

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <span>{t("eyebrow")}</span>
          <h1>{t("title")}</h1>
          <p>{t("subtitle")}</p>
        </div>
        <Link href="/scenes">
          <Button type="primary">{t("browseScenes")}</Button>
        </Link>
      </header>

      <section className={styles.summary}>
        <article>
          <span>{t("savedCount")}</span>
          <strong>{favoriteScenes.length}</strong>
        </article>
        <article>
          <span>{t("practiceCount")}</span>
          <strong>{records.length}</strong>
        </article>
        <article>
          <span>{t("sceneCount")}</span>
          <strong>{new Set(records.map((record) => record.sceneId)).size}</strong>
        </article>
      </section>

      <Tabs
        className={styles.tabs}
        defaultActiveKey="saved"
        items={[
          { key: "saved", label: t("savedTab"), children: savedContent },
          { key: "history", label: t("historyTab"), children: historyContent },
        ]}
      />
    </main>
  );
}
