"use client";

import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  BookOutlined,
  CheckCircleFilled,
  ClockCircleOutlined,
  HeartFilled,
  HeartOutlined,
  StarFilled,
  StarOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { useLocale, useTranslations } from "next-intl";

import { getSceneMastery } from "@/features/learning/learning-data";
import { Link } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { useLearningStore } from "@/stores/learning-store";

import { getSceneDetail } from "../scene-detail-data";
import type { Scene } from "../types";
import { SceneCover } from "./scene-cover";
import styles from "./scene-detail.module.css";

type SceneDetailProps = {
  scene: Scene;
};

export function SceneDetail({ scene }: SceneDetailProps) {
  const locale = useLocale() as AppLocale;
  const t = useTranslations("SceneDetail");
  const sceneT = useTranslations("Scenes");
  const favorite = useLearningStore((store) =>
    store.favoriteSceneIds.includes(scene.id),
  );
  const toggleFavorite = useLearningStore((store) => store.toggleFavorite);
  const records = useLearningStore((store) => store.records);
  const detail = getSceneDetail(scene.id);
  const sceneRecords = records.filter((record) => record.sceneId === scene.id);
  const mastery = getSceneMastery(records, scene.id);
  const practiceHref = `/practice/${scene.slug}?scene=${scene.slug}` as const;

  return (
    <main className={styles.page}>
      <Link href="/scenes" className={styles.back}>
        <ArrowLeftOutlined aria-hidden="true" />
        {t("back")}
      </Link>

      <section className={styles.hero}>
        <div className={styles.cover}>
          <SceneCover
            label={scene.title[locale]}
            mark={scene.coverMark}
            tone={scene.coverTone}
          />
        </div>

        <div className={styles.heroContent}>
          <div className={styles.headingRow}>
            <div>
              <span className={styles.category}>
                {sceneT(`category.${scene.category}`)}
              </span>
              <h1>{scene.title[locale]}</h1>
            </div>
            <button
              type="button"
              className={`${styles.favorite} ${
                favorite ? styles.favoriteActive : ""
              }`}
              aria-pressed={favorite}
              onClick={() => toggleFavorite(scene.id)}
            >
              {favorite ? (
                <HeartFilled aria-hidden="true" />
              ) : (
                <HeartOutlined aria-hidden="true" />
              )}
              {favorite ? t("saved") : t("save")}
            </button>
          </div>

          <p className={styles.subtitle}>{scene.subtitle[locale]}</p>
          <div className={styles.meta} aria-label={t("overview")}>
            <span>
              <span className={styles.stars} aria-hidden="true">
                {[1, 2, 3, 4, 5].map((value) =>
                  value <= scene.difficulty ? (
                    <StarFilled key={value} />
                  ) : (
                    <StarOutlined key={value} />
                  ),
                )}
              </span>
              <span className={styles.srOnly}>
                {sceneT("difficultyValue", { value: scene.difficulty })}
              </span>
            </span>
            <span>
              <ClockCircleOutlined aria-hidden="true" />
              {t("minutes", { count: scene.estimatedMinutes })}
            </span>
            <span>
              <BookOutlined aria-hidden="true" />
              {t("lessons", { count: scene.lessonCount })}
            </span>
          </div>

          <p className={styles.context}>{detail.context[locale]}</p>

          <Link href={practiceHref} className={styles.start}>
            {t("start")}
            <ArrowRightOutlined aria-hidden="true" />
          </Link>
        </div>
      </section>

      <section className={styles.contentGrid}>
        <div className={styles.mainColumn}>
          <article className={styles.card}>
            <div className={styles.sectionHeading}>
              <span>{t("goalsEyebrow")}</span>
              <h2>{t("goalsTitle")}</h2>
            </div>
            <ol className={styles.goals}>
              {detail.goals.map((goal, index) => (
                <li key={goal.en}>
                  <span>{index + 1}</span>
                  <p>{goal[locale]}</p>
                  <CheckCircleFilled aria-hidden="true" />
                </li>
              ))}
            </ol>
          </article>

          <article className={styles.card}>
            <div className={styles.sectionHeading}>
              <span>{t("phrasesEyebrow")}</span>
              <h2>{t("phrasesTitle")}</h2>
            </div>
            <div className={styles.phrases}>
              {detail.phrases.map((phrase) => (
                <div key={phrase.expression}>
                  <strong>{phrase.expression}</strong>
                  <p>{phrase.meaning[locale]}</p>
                </div>
              ))}
            </div>
          </article>
        </div>

        <aside className={styles.sideColumn}>
          <article className={styles.partnerCard}>
            <span className={styles.partnerIcon}>
              <TeamOutlined aria-hidden="true" />
            </span>
            <span>{t("partner")}</span>
            <strong>{detail.partner[locale]}</strong>
            <p>{t("partnerDescription")}</p>
          </article>

          <article className={styles.progressCard}>
            <span>{t("yourProgress")}</span>
            <div>
              <strong>{mastery}%</strong>
              <small>{t("mastery")}</small>
            </div>
            <i>
              <b style={{ width: `${mastery}%` }} />
            </i>
            <p>
              {sceneRecords.length
                ? t("practiceSummary", { count: sceneRecords.length })
                : t("noPractice")}
            </p>
          </article>
        </aside>
      </section>
    </main>
  );
}
