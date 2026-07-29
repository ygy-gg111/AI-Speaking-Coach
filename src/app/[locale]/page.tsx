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
import { SceneCard } from "@/features/scenes/components/scene-card";
import { mockScenes } from "@/features/scenes/mock-scenes";
import { Link } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";

import styles from "./page.module.css";

export default function HomePage() {
  const locale = useLocale() as AppLocale;
  const t = useTranslations("Home");
  const recommended = mockScenes.slice(0, 3);
  const recentScene = mockScenes[1];

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
          detail={t("dailyProgress", { current: 0, total: 10 })}
          progress={10}
          tone="red"
        />
        <MetricCard
          icon={<BookOutlined />}
          label={t("learnedScenes")}
          value={32}
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
          value={245}
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
          duration={t("recordDuration", { minutes: 12 })}
          expressions={t("recordExpressions", { count: 8 })}
          corrections={t("recordCorrections", { count: 5 })}
          time={t("recordTime")}
        />
      </section>

      <aside className={styles.mobileStreak}>
        <span className={styles.fireIcon}>
          <FireFilled />
        </span>
        <div>
          <strong>{t("streakDays", { count: 15 })}</strong>
          <p>{t("streakMessage")}</p>
        </div>
      </aside>
    </main>
  );
}
