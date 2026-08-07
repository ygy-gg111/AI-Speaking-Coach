"use client";

import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  BookOutlined,
  CalendarOutlined,
  CheckCircleFilled,
  ClockCircleOutlined,
  FormOutlined,
  ReloadOutlined,
  StarFilled,
} from "@ant-design/icons";
import { Empty } from "antd";
import { useQuery } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { useMemo } from "react";

import {
  getLearningRecordsForDate,
  summarizeLearningByDate,
} from "@/features/learning/learning-data";
import { getCalendarDate } from "@/features/learning/learning-client";
import { SceneCover } from "@/features/scenes/components/scene-cover";
import { useSceneCatalog } from "@/features/scenes/hooks/use-scene-catalog";
import { Link } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { useLearningStore } from "@/stores/learning-store";

import styles from "./daily-learning-detail.module.css";

type DailyLearningDetailProps = {
  date: string;
};

const dailyGoalMinutes = 10;

export function DailyLearningDetail({ date }: DailyLearningDetailProps) {
  const locale = useLocale() as AppLocale;
  const t = useTranslations("CalendarDay");
  const localRecords = useLearningStore((store) => store.records);
  const scenes = useSceneCatalog().data ?? [];
  const timezoneOffset = new Date().getTimezoneOffset();
  const dateQuery = useQuery({
    queryKey: ["calendar-date", date, timezoneOffset],
    queryFn: () => getCalendarDate(date, timezoneOffset),
    retry: false,
    staleTime: 60 * 1_000,
  });
  const records = dateQuery.data?.records ?? localRecords;
  const dayRecords = useMemo(
    () => getLearningRecordsForDate(records, date),
    [date, records],
  );
  const summary = useMemo(
    () => summarizeLearningByDate(dayRecords).get(date) ?? null,
    [date, dayRecords],
  );
  const dateValue = new Date(`${date}T12:00:00`);
  const month = date.slice(0, 7);
  const dateLabel = new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(dateValue);
  const shortDateLabel = new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
  }).format(dateValue);
  const timeFormatter = new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
  });
  const averageMastery = dayRecords.length
    ? Math.round(
        dayRecords.reduce((total, record) => total + record.mastery, 0) /
          dayRecords.length,
      )
    : 0;
  const sceneCount = new Set(dayRecords.map((record) => record.sceneId)).size;
  const goalProgress = Math.min(
    100,
    Math.round(((summary?.durationMinutes ?? 0) / dailyGoalMinutes) * 100),
  );
  const goalReached = goalProgress >= 100;

  return (
    <main className={styles.page}>
      <Link
        href={`/calendar?month=${month}&date=${date}`}
        className={styles.back}
      >
        <ArrowLeftOutlined aria-hidden="true" />
        {t("back")}
      </Link>

      <header className={styles.header}>
        <div>
          <span>{t("eyebrow")}</span>
          <h1>{dateLabel}</h1>
          <p>
            {summary
              ? t("subtitle", { count: summary.practiceCount })
              : t("emptySubtitle")}
          </p>
        </div>
        <span className={styles.dateBadge}>
          <CalendarOutlined aria-hidden="true" />
          {shortDateLabel}
        </span>
      </header>

      {summary ? (
        <>
          <section className={styles.summary} aria-label={t("summaryLabel")}>
            <article>
              <span className={styles.metricIcon}>
                <ClockCircleOutlined aria-hidden="true" />
              </span>
              <div>
                <span>{t("duration")}</span>
                <strong>{t("minuteValue", { count: summary.durationMinutes })}</strong>
              </div>
            </article>
            <article>
              <span className={styles.metricIcon}>
                <BookOutlined aria-hidden="true" />
              </span>
              <div>
                <span>{t("expressions")}</span>
                <strong>{summary.newExpressions}</strong>
              </div>
            </article>
            <article>
              <span className={styles.metricIcon}>
                <FormOutlined aria-hidden="true" />
              </span>
              <div>
                <span>{t("corrections")}</span>
                <strong>{summary.corrections}</strong>
              </div>
            </article>
            <article>
              <span className={styles.metricIcon}>
                <StarFilled aria-hidden="true" />
              </span>
              <div>
                <span>{t("averageMastery")}</span>
                <strong>{averageMastery}%</strong>
              </div>
            </article>
          </section>

          <section className={styles.layout}>
            <div className={styles.recordsColumn}>
              <div className={styles.sectionHeading}>
                <div>
                  <span>{t("recordsEyebrow")}</span>
                  <h2>{t("recordsTitle")}</h2>
                </div>
                <span>{t("recordCount", { count: dayRecords.length })}</span>
              </div>

              <div className={styles.records}>
                {dayRecords.map((record, index) => {
                  const scene = scenes.find((item) => item.id === record.sceneId);
                  if (!scene) return null;
                  const reviewHref =
                    `/practice/${record.conversationId}/review?scene=${encodeURIComponent(scene.slug)}` as const;
                  const retryHref =
                    `/practice/${scene.slug}?scene=${encodeURIComponent(scene.slug)}` as const;

                  return (
                    <article className={styles.record} key={record.id}>
                      <div className={styles.recordIndex}>
                        <span>{String(index + 1).padStart(2, "0")}</span>
                        <time>
                          {timeFormatter.format(new Date(record.completedAt))}
                        </time>
                      </div>
                      <SceneCover
                        compact
                        label={scene.title[locale]}
                        mark={scene.coverMark}
                        tone={scene.coverTone}
                      />
                      <div className={styles.recordBody}>
                        <div>
                          <span>{t("sceneLabel")}</span>
                          <h3>{scene.title[locale]}</h3>
                        </div>
                        <dl>
                          <div>
                            <dt>{t("practiceTime")}</dt>
                            <dd>
                              {t("minuteValue", {
                                count: record.durationMinutes,
                              })}
                            </dd>
                          </div>
                          <div>
                            <dt>{t("newExpressions")}</dt>
                            <dd>{record.newExpressions}</dd>
                          </div>
                          <div>
                            <dt>{t("corrected")}</dt>
                            <dd>{record.corrections}</dd>
                          </div>
                          <div>
                            <dt>{t("mastery")}</dt>
                            <dd>{record.mastery}%</dd>
                          </div>
                        </dl>
                        <div className={styles.recordActions}>
                          <Link href={reviewHref}>
                            {t("viewReview")}
                            <ArrowRightOutlined aria-hidden="true" />
                          </Link>
                          <Link href={retryHref}>
                            <ReloadOutlined aria-hidden="true" />
                            {t("retryScene")}
                          </Link>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>

            <aside className={styles.insights}>
              <article className={styles.goalCard}>
                <span>{t("dailyGoal")}</span>
                <div>
                  <strong>{goalProgress}%</strong>
                  {goalReached && <CheckCircleFilled aria-hidden="true" />}
                </div>
                <i>
                  <b style={{ width: `${goalProgress}%` }} />
                </i>
                <p>
                  {goalReached
                    ? t("goalReached")
                    : t("goalRemaining", {
                        count: Math.max(
                          0,
                          dailyGoalMinutes - summary.durationMinutes,
                        ),
                      })}
                </p>
              </article>

              <article className={styles.insightCard}>
                <span>{t("dailyInsight")}</span>
                <strong>
                  {t("sceneSummary", {
                    scenes: sceneCount,
                    expressions: summary.newExpressions,
                  })}
                </strong>
                <p>{t("insightDescription")}</p>
              </article>

              <Link href="/reports" className={styles.reportLink}>
                {t("viewReports")}
                <ArrowRightOutlined aria-hidden="true" />
              </Link>
            </aside>
          </section>
        </>
      ) : (
        <section className={styles.empty}>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={t("emptyDescription")}
          >
            <Link href="/scenes" className={styles.start}>
              {t("startPractice")}
              <ArrowRightOutlined aria-hidden="true" />
            </Link>
          </Empty>
        </section>
      )}
    </main>
  );
}
