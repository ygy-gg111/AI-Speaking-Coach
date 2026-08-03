"use client";

import {
  ArrowRightOutlined,
  BookOutlined,
  ClockCircleOutlined,
  FireFilled,
  TrophyOutlined,
} from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { Alert, Button, Empty, Skeleton } from "antd";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { getCurrentUser } from "@/features/auth";
import { MetricCard } from "@/features/dashboard/components/metric-card";
import { PracticeRecord } from "@/features/dashboard/components/practice-record";
import { getDashboard } from "@/features/dashboard/dashboard-client";
import type { DashboardSummary } from "@/features/dashboard/dashboard-data";
import { SceneCard } from "@/features/scenes/components/scene-card";
import { getScene, getScenes } from "@/features/scenes/scene-client";
import { Link } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { ApiClientError } from "@/lib/api-client";

import styles from "./page.module.css";

const emptySummary: DashboardSummary = {
  dailyGoalMinutes: 10,
  todayMinutes: 0,
  learnedScenes: 0,
  masteredExpressions: 0,
  yesterdayScenes: 0,
  yesterdayExpressions: 0,
  streak: 0,
  recentRecord: null,
};

export default function HomePage() {
  const locale = useLocale() as AppLocale;
  const t = useTranslations("Home");
  const [recommendationPage, setRecommendationPage] = useState(0);
  const timezoneOffset = new Date().getTimezoneOffset();
  const userQuery = useQuery({
    queryKey: ["current-user"],
    queryFn: getCurrentUser,
    retry: false,
  });
  const dashboardQuery = useQuery({
    queryKey: ["dashboard", timezoneOffset],
    queryFn: () => getDashboard(timezoneOffset),
    retry: false,
    staleTime: 60 * 1_000,
  });
  const scenesQuery = useQuery({
    queryKey: ["scenes"],
    queryFn: () => getScenes(),
    retry: false,
    staleTime: 5 * 60 * 1_000,
  });
  const summary = dashboardQuery.data ?? emptySummary;
  const recentRecord = summary.recentRecord;
  const dailyGoalMinutes = summary.dailyGoalMinutes;
  const recentSceneQuery = useQuery({
    queryKey: ["scene", recentRecord?.sceneId],
    queryFn: () => getScene(recentRecord!.sceneId),
    enabled: Boolean(recentRecord?.sceneId),
    retry: false,
    staleTime: 5 * 60 * 1_000,
  });
  const scenes = useMemo(() => scenesQuery.data ?? [], [scenesQuery.data]);
  const recommended = useMemo(() => {
    if (scenes.length <= 3) return scenes;
    const start = (recommendationPage * 3) % scenes.length;
    return Array.from(
      { length: 3 },
      (_, index) => scenes[(start + index) % scenes.length],
    );
  }, [recommendationPage, scenes]);
  const displayName =
    userQuery.data?.profile.displayName ??
    userQuery.data?.email.split("@")[0] ??
    null;
  const learnedSceneProgress = scenes.length
    ? (summary.learnedScenes / scenes.length) * 100
    : undefined;
  const recentTime = recentRecord
    ? new Intl.DateTimeFormat(locale, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(recentRecord.completedAt))
    : "";
  const dashboardNeedsAttention =
    dashboardQuery.isError &&
    !(
      dashboardQuery.error instanceof ApiClientError &&
      dashboardQuery.error.status === 401
    );
  const hasRequestError =
    dashboardNeedsAttention || scenesQuery.isError || recentSceneQuery.isError;

  return (
    <main className={styles.page}>
      <header className={styles.welcome}>
        <div>
          <span className={styles.eyebrow}>{t("eyebrow")}</span>
          <h1>
            {displayName
              ? t("greetingWithName", { name: displayName })
              : t("greetingGuest")} {" "}
            <span>👋</span>
          </h1>
          <p>{t("greetingSubtitle")}</p>
        </div>
        <Link href="/scenes">
          <Button type="primary" icon={<ArrowRightOutlined />}>
            {t("quickStart")}
          </Button>
        </Link>
      </header>

      {hasRequestError && (
        <Alert
          className={styles.dataAlert}
          type="warning"
          showIcon
          message={t("loadError")}
          action={
            <Button
              size="small"
              onClick={() => {
                void dashboardQuery.refetch();
                void scenesQuery.refetch();
              }}
            >
              {t("retry")}
            </Button>
          }
        />
      )}

      <section className={styles.metricGrid} aria-label={t("metrics")}>
        <MetricCard
          icon={<ClockCircleOutlined />}
          label={t("dailyGoal")}
          value={dailyGoalMinutes}
          unit={t("minutes")}
          detail={t("dailyProgress", {
            current: Math.min(summary.todayMinutes, dailyGoalMinutes),
            total: dailyGoalMinutes,
          })}
          progress={
            dailyGoalMinutes > 0
              ? (summary.todayMinutes / dailyGoalMinutes) * 100
              : 0
          }
          tone="red"
        />
        <MetricCard
          icon={<BookOutlined />}
          label={t("learnedScenes")}
          value={summary.learnedScenes}
          unit={t("countUnit")}
          detail={
            <>
              {t("yesterday")} <b>+{summary.yesterdayScenes}</b>
            </>
          }
          progress={learnedSceneProgress}
          tone="blue"
        />
        <MetricCard
          icon={<TrophyOutlined />}
          label={t("masteredExpressions")}
          value={summary.masteredExpressions}
          unit={t("sentenceUnit")}
          detail={
            <>
              {t("yesterday")} <b>+{summary.yesterdayExpressions}</b>
            </>
          }
          tone="purple"
        />
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <span className={styles.sectionEyebrow}>{t("recommendedEyebrow")}</span>
            <h2>{t("recommendedTitle")}</h2>
          </div>
          <button
            type="button"
            className={styles.refreshButton}
            disabled={scenesQuery.isLoading || scenes.length <= 3}
            onClick={() => setRecommendationPage((page) => page + 1)}
          >
            {t("refresh")}
          </button>
        </div>
        {scenesQuery.isLoading ? (
          <div className={styles.recommendedGrid}>
            {Array.from({ length: 3 }, (_, index) => (
              <Skeleton.Node key={index} active className={styles.sceneSkeleton} />
            ))}
          </div>
        ) : recommended.length > 0 ? (
          <div className={styles.recommendedGrid}>
            {recommended.map((scene) => (
              <SceneCard key={scene.id} scene={scene} variant="recommended" />
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <Empty description={t("recommendedEmpty")} />
          </div>
        )}
      </section>

      <section className={`${styles.section} ${styles.recentSection}`}>
        <div className={styles.sectionHeader}>
          <h2>{t("recentTitle")}</h2>
          <Link href="/my-scenes">{t("viewAll")}</Link>
        </div>
        {recentRecord && recentSceneQuery.data ? (
          <PracticeRecord
            scene={recentSceneQuery.data}
            title={recentSceneQuery.data.title[locale]}
            duration={t("recordDuration", {
              minutes: recentRecord.durationMinutes,
            })}
            expressions={t("recordExpressions", {
              count: recentRecord.newExpressions,
            })}
            corrections={t("recordCorrections", {
              count: recentRecord.corrections,
            })}
            time={recentTime}
          />
        ) : recentRecord && recentSceneQuery.isLoading ? (
          <Skeleton active />
        ) : (
          <div className={styles.emptyState}>
            <Empty description={t("recentEmpty")}>
              <Link href="/scenes">
                <Button type="primary">{t("quickStart")}</Button>
              </Link>
            </Empty>
          </div>
        )}
      </section>

      <aside className={styles.mobileStreak}>
        <span className={styles.fireIcon}>
          <FireFilled />
        </span>
        <div>
          <strong>{t("streakDays", { count: summary.streak })}</strong>
          <p>{t("streakMessage", { minutes: dailyGoalMinutes })}</p>
        </div>
      </aside>
    </main>
  );
}
