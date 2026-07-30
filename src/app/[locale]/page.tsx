"use client";

import {
  ArrowRightOutlined,
  BookOutlined,
  ClockCircleOutlined,
  FireFilled,
  TrophyOutlined,
} from "@ant-design/icons";
import { Button } from "antd";
import { useLocale, useTranslations } from "next-intl";

import { MetricCard } from "@/features/dashboard/components/metric-card";
import { PracticeRecord } from "@/features/dashboard/components/practice-record";
import {
  getLearningStreak,
  toLocalDateKey,
} from "@/features/learning/learning-data";
import { SceneCard } from "@/features/scenes/components/scene-card";
import { mockScenes } from "@/features/scenes/mock-scenes";
import { Link } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { useLearningStore } from "@/stores/learning-store";

import styles from "./page.module.css";

const homeToday = new Date();

export default function HomePage() {
  const locale = useLocale() as AppLocale;
  const t = useTranslations("Home");
  const recommended = mockScenes.slice(0, 3);
  const records = useLearningStore((store) => store.records);
  const sortedRecords = [...records].sort(
    (left, right) =>
      new Date(right.completedAt).getTime() -
      new Date(left.completedAt).getTime(),
  );
  const recentRecord = sortedRecords[0];
  const recentScene =
    mockScenes.find((scene) => scene.id === recentRecord?.sceneId) ??
    mockScenes[1];
  const todayKey = toLocalDateKey(homeToday);
  const todayMinutes = records
    .filter((record) => toLocalDateKey(record.completedAt) === todayKey)
    .reduce((sum, record) => sum + record.durationMinutes, 0);
  const learnedScenes = new Set(records.map((record) => record.sceneId)).size;
  const masteredExpressions = records.reduce(
    (sum, record) => sum + record.newExpressions,
    0,
  );
  const streak = getLearningStreak(records, homeToday);
  const recentTime = new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(recentRecord?.completedAt ?? homeToday));

  return (
    <main className={styles.page}>
      <header className={styles.welcome}>
        <div>
          <span className={styles.eyebrow}>{t("eyebrow")}</span>
          <h1>
            {t("greeting")} <span>👋</span>
          </h1>
          <p>{t("greetingSubtitle")}</p>
        </div>
        <Link href="/scenes">
          <Button type="primary" icon={<ArrowRightOutlined />}>
            {t("quickStart")}
          </Button>
        </Link>
      </header>

      <section className={styles.metricGrid} aria-label={t("metrics")}>
        <MetricCard
          icon={<ClockCircleOutlined />}
          label={t("dailyGoal")}
          value={10}
          unit={t("minutes")}
          detail={t("dailyProgress", {
            current: Math.min(todayMinutes, 10),
            total: 10,
          })}
          progress={Math.min(100, todayMinutes * 10)}
          tone="red"
        />
        <MetricCard
          icon={<BookOutlined />}
          label={t("learnedScenes")}
          value={learnedScenes}
          unit={t("countUnit")}
          detail={
            <>
              {t("yesterday")} <b>+2</b>
            </>
          }
          progress={64}
          tone="blue"
        />
        <MetricCard
          icon={<TrophyOutlined />}
          label={t("masteredExpressions")}
          value={masteredExpressions}
          unit={t("sentenceUnit")}
          detail={
            <>
              {t("yesterday")} <b>+12</b>
            </>
          }
          progress={78}
          tone="purple"
        />
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <span className={styles.sectionEyebrow}>{t("recommendedEyebrow")}</span>
            <h2>{t("recommendedTitle")}</h2>
          </div>
          <Link href="/scenes">{t("refresh")}</Link>
        </div>
        <div className={styles.recommendedGrid}>
          {recommended.map((scene) => (
            <SceneCard key={scene.id} scene={scene} variant="recommended" />
          ))}
        </div>
      </section>

      <section className={`${styles.section} ${styles.recentSection}`}>
        <div className={styles.sectionHeader}>
          <h2>{t("recentTitle")}</h2>
          <Link href="/my-scenes">{t("viewAll")}</Link>
        </div>
        <PracticeRecord
          scene={recentScene}
          title={recentScene.title[locale]}
          duration={t("recordDuration", {
            minutes: recentRecord?.durationMinutes ?? 12,
          })}
          expressions={t("recordExpressions", {
            count: recentRecord?.newExpressions ?? 8,
          })}
          corrections={t("recordCorrections", {
            count: recentRecord?.corrections ?? 5,
          })}
          time={recentTime}
        />
      </section>

      <aside className={styles.mobileStreak}>
        <span className={styles.fireIcon}>
          <FireFilled />
        </span>
        <div>
          <strong>{t("streakDays", { count: streak })}</strong>
          <p>{t("streakMessage")}</p>
        </div>
      </aside>
    </main>
  );
}
