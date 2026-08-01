"use client";

import {
  ArrowDownOutlined,
  ArrowRightOutlined,
  ArrowUpOutlined,
  BookOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  RiseOutlined,
} from "@ant-design/icons";
import { Button, Progress, Segmented } from "antd";
import { useQuery } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { mockScenes } from "@/features/scenes/mock-scenes";
import { buildLearningReport } from "@/features/reports/report-data";
import { getLearningReport } from "@/features/reports/report-client";
import type { ReportPeriod } from "@/features/reports/types";
import { Link } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { useLearningStore } from "@/stores/learning-store";

import styles from "./reports.module.css";

export default function ReportsPage() {
  const locale = useLocale() as AppLocale;
  const t = useTranslations("Reports");
  const records = useLearningStore((store) => store.records);
  const mistakes = useLearningStore((store) => store.mistakes);
  const [period, setPeriod] = useState<ReportPeriod>(7);
  const timezoneOffset = new Date().getTimezoneOffset();
  const localReport = useMemo(
    () => buildLearningReport(records, mistakes, period),
    [mistakes, period, records],
  );
  const reportQuery = useQuery({
    queryKey: ["reports", period, timezoneOffset],
    queryFn: () => getLearningReport(period, timezoneOffset),
    retry: false,
    staleTime: 60 * 1_000,
  });
  const report = reportQuery.data
    ? { ...reportQuery.data, weaknesses: localReport.weaknesses }
    : localReport;
  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        month: "short",
        day: "numeric",
      }),
    [locale],
  );
  const maxDuration = Math.max(
    1,
    ...report.trend.map((item) => item.durationMinutes),
  );
  const topScene = report.scenes[0];
  const topSceneData = topScene
    ? mockScenes.find((scene) => scene.id === topScene.sceneId)
    : null;
  const topWeakness = report.weaknesses[0];

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <span>{t("eyebrow")}</span>
          <h1>{t("title")}</h1>
          <p>{t("subtitle")}</p>
        </div>
        <Segmented
          value={period}
          onChange={(value) => setPeriod(value as ReportPeriod)}
          options={[
            { label: t("period.week"), value: 7 },
            { label: t("period.month"), value: 30 },
          ]}
          aria-label={t("periodLabel")}
        />
      </header>

      <div className={styles.dateRange}>
        <CalendarOutlined />
        {t("dateRange", {
          start: dateFormatter.format(new Date(`${report.startDate}T12:00:00`)),
          end: dateFormatter.format(new Date(`${report.endDate}T12:00:00`)),
        })}
      </div>

      <section className={styles.summary} aria-label={t("summaryLabel")}>
        <article>
          <span className={styles.metricIcon}>
            <ClockCircleOutlined />
          </span>
          <div>
            <span>{t("duration")}</span>
            <strong>
              {report.durationMinutes}
              <small>{t("minutes")}</small>
            </strong>
          </div>
          <ChangeBadge value={report.durationChange} />
        </article>
        <article>
          <span className={styles.metricIcon}>
            <CalendarOutlined />
          </span>
          <div>
            <span>{t("activeDays")}</span>
            <strong>
              {report.activeDays}
              <small>{t("days")}</small>
            </strong>
          </div>
        </article>
        <article>
          <span className={styles.metricIcon}>
            <RiseOutlined />
          </span>
          <div>
            <span>{t("practiceCount")}</span>
            <strong>
              {report.practiceCount}
              <small>{t("sessions")}</small>
            </strong>
          </div>
        </article>
        <article>
          <span className={styles.metricIcon}>
            <BookOutlined />
          </span>
          <div>
            <span>{t("newExpressions")}</span>
            <strong>
              {report.newExpressions}
              <small>{t("expressions")}</small>
            </strong>
          </div>
        </article>
      </section>

      <section className={styles.reportGrid}>
        <article className={`${styles.card} ${styles.trendCard}`}>
          <header>
            <div>
              <span>{t("trend.eyebrow")}</span>
              <h2>{t("trend.title")}</h2>
            </div>
            <Link href="/calendar">{t("viewCalendar")}</Link>
          </header>
          <div
            className={`${styles.chart} ${
              period === 30 ? styles.monthChart : ""
            }`}
            role="img"
            aria-label={t("trend.chartLabel")}
          >
            {report.trend.map((day, index) => (
              <div className={styles.barColumn} key={day.date}>
                <span>{day.durationMinutes || ""}</span>
                <div className={styles.barTrack}>
                  <i
                    style={{
                      height: day.durationMinutes
                        ? `${Math.max(
                            10,
                            (day.durationMinutes / maxDuration) * 100,
                          )}%`
                        : "3px",
                    }}
                    className={day.durationMinutes ? styles.activeBar : ""}
                  />
                </div>
                <small>
                  {formatTrendLabel(day.date, index, period, locale)}
                </small>
              </div>
            ))}
          </div>
        </article>

        <article className={`${styles.card} ${styles.insightCard}`}>
          <header>
            <div>
              <span>{t("insight.eyebrow")}</span>
              <h2>{t("insight.title")}</h2>
            </div>
          </header>
          <div className={styles.highlight}>
            <span>{t("insight.totalTime")}</span>
            <strong>
              {report.durationMinutes}
              <small>{t("minutes")}</small>
            </strong>
            <p>
              {report.durationChange === null
                ? t("insight.firstPeriod")
                : report.durationChange >= 0
                  ? t("insight.increased", {
                      value: Math.abs(report.durationChange),
                    })
                  : t("insight.decreased", {
                      value: Math.abs(report.durationChange),
                    })}
            </p>
          </div>
          <dl className={styles.insightList}>
            <div>
              <dt>{t("insight.topScene")}</dt>
              <dd>{topSceneData?.title[locale] ?? t("noData")}</dd>
            </div>
            <div>
              <dt>{t("insight.averageMastery")}</dt>
              <dd>{report.averageMastery}%</dd>
            </div>
            <div>
              <dt>{t("insight.corrections")}</dt>
              <dd>{report.corrections}</dd>
            </div>
          </dl>
        </article>

        <article className={`${styles.card} ${styles.abilityCard}`}>
          <header>
            <div>
              <span>{t("ability.eyebrow")}</span>
              <h2>{t("ability.title")}</h2>
            </div>
          </header>
          <div className={styles.abilityList}>
            {report.abilities.map((ability) => (
              <div key={ability.key}>
                <div>
                  <span>{t(`ability.metric.${ability.key}`)}</span>
                  <strong>{ability.value}%</strong>
                </div>
                <Progress
                  percent={ability.value}
                  showInfo={false}
                  strokeColor="#7157f5"
                  railColor="#efedf6"
                  aria-label={t("ability.metricValue", {
                    metric: t(`ability.metric.${ability.key}`),
                    value: ability.value,
                  })}
                />
              </div>
            ))}
          </div>
          <p className={styles.sourceNote}>{t("ability.source")}</p>
        </article>

        <article className={`${styles.card} ${styles.sceneCard}`}>
          <header>
            <div>
              <span>{t("scenes.eyebrow")}</span>
              <h2>{t("scenes.title")}</h2>
            </div>
          </header>
          {report.scenes.length ? (
            <div className={styles.sceneList}>
              {report.scenes.slice(0, 5).map((scene) => {
                const sceneData = mockScenes.find(
                  (item) => item.id === scene.sceneId,
                );
                return (
                  <div key={scene.sceneId}>
                    <div>
                      <span>
                        {sceneData?.title[locale] ?? t("unknownScene")}
                      </span>
                      <strong>{scene.share}%</strong>
                    </div>
                    <div className={styles.sceneBar}>
                      <i style={{ width: `${scene.share}%` }} />
                    </div>
                    <small>
                      {t("scenes.detail", {
                        count: scene.practiceCount,
                        minutes: scene.durationMinutes,
                      })}
                    </small>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className={styles.empty}>{t("noData")}</p>
          )}
        </article>

        <article className={`${styles.card} ${styles.weaknessCard}`}>
          <header>
            <div>
              <span>{t("weakness.eyebrow")}</span>
              <h2>{t("weakness.title")}</h2>
            </div>
          </header>
          {topWeakness ? (
            <>
              <div className={styles.weaknessFocus}>
                <span>{t(`weakness.category.${topWeakness.category}`)}</span>
                <strong>{t("weakness.pending", { count: topWeakness.count })}</strong>
                <p>{t(`weakness.tip.${topWeakness.category}`)}</p>
              </div>
              <div className={styles.weaknessBars}>
                {report.weaknesses.map((item) => (
                  <div key={item.category}>
                    <span>{t(`weakness.category.${item.category}`)}</span>
                    <i>
                      <b style={{ width: `${item.share}%` }} />
                    </i>
                    <strong>{item.count}</strong>
                  </div>
                ))}
              </div>
              <Link href="/mistakes">
                <Button type="primary" block>
                  {t("weakness.review")}
                  <ArrowRightOutlined />
                </Button>
              </Link>
            </>
          ) : (
            <p className={styles.empty}>{t("weakness.empty")}</p>
          )}
        </article>
      </section>
    </main>
  );
}

function ChangeBadge({ value }: { value: number | null }) {
  const t = useTranslations("Reports");
  if (value === null) {
    return <span className={styles.noChange}>{t("firstComparison")}</span>;
  }
  const positive = value >= 0;
  return (
    <span className={positive ? styles.positive : styles.negative}>
      {positive ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
      {Math.abs(value)}%
    </span>
  );
}

function formatTrendLabel(
  date: string,
  index: number,
  period: ReportPeriod,
  locale: AppLocale,
) {
  const value = new Date(`${date}T12:00:00`);
  if (period === 7) {
    return new Intl.DateTimeFormat(locale, { weekday: "short" }).format(value);
  }
  return index % 5 === 0 || index === period - 1 ? value.getDate() : "";
}
