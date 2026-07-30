"use client";

import {
  BookOutlined,
  ClockCircleOutlined,
  FormOutlined,
  LeftOutlined,
  RightOutlined,
} from "@ant-design/icons";
import { Button, Empty } from "antd";
import { useLocale, useTranslations } from "next-intl";
import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";

import {
  buildCalendarMonth,
  summarizeLearningByDate,
  toLocalDateKey,
} from "@/features/learning/learning-data";
import { SceneCover } from "@/features/scenes/components/scene-cover";
import { mockScenes } from "@/features/scenes/mock-scenes";
import { Link } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { useLearningStore } from "@/stores/learning-store";

import styles from "./calendar.module.css";

const initialToday = new Date();
const initialMonth = `${initialToday.getFullYear()}-${String(
  initialToday.getMonth() + 1,
).padStart(2, "0")}`;
const initialDate = toLocalDateKey(initialToday);

function parseMonth(value: string | null) {
  if (!value?.match(/^\d{4}-\d{2}$/)) {
    return {
      year: initialToday.getFullYear(),
      month: initialToday.getMonth(),
      value: initialMonth,
    };
  }
  const [year, month] = value.split("-").map(Number);
  if (month < 1 || month > 12) {
    return {
      year: initialToday.getFullYear(),
      month: initialToday.getMonth(),
      value: initialMonth,
    };
  }
  return { year, month: month - 1, value };
}

function monthValue(year: number, month: number) {
  const date = new Date(year, month, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function CalendarContent() {
  const locale = useLocale() as AppLocale;
  const t = useTranslations("Calendar");
  const searchParams = useSearchParams();
  const records = useLearningStore((store) => store.records);
  const visible = parseMonth(searchParams.get("month"));
  const selectedDate = searchParams.get("date") ?? initialDate;
  const days = useMemo(
    () =>
      buildCalendarMonth(
        visible.year,
        visible.month,
        records,
        initialToday,
      ),
    [records, visible.month, visible.year],
  );
  const summaries = useMemo(
    () => summarizeLearningByDate(records),
    [records],
  );
  const selectedSummary = summaries.get(selectedDate) ?? null;
  const selectedRecords = useMemo(
    () =>
      records
        .filter((record) => toLocalDateKey(record.completedAt) === selectedDate)
        .sort(
          (left, right) =>
            new Date(right.completedAt).getTime() -
            new Date(left.completedAt).getTime(),
        ),
    [records, selectedDate],
  );
  const monthLabel = new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
  }).format(new Date(visible.year, visible.month, 1));
  const selectedLabel = new Intl.DateTimeFormat(locale, {
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(new Date(`${selectedDate}T12:00:00`));
  const previousMonth = monthValue(visible.year, visible.month - 1);
  const nextMonth = monthValue(visible.year, visible.month + 1);
  const weekDays = [
    t("week.monday"),
    t("week.tuesday"),
    t("week.wednesday"),
    t("week.thursday"),
    t("week.friday"),
    t("week.saturday"),
    t("week.sunday"),
  ];

  return (
    <main className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <span>{t("eyebrow")}</span>
          <h1>{t("title")}</h1>
          <p>{t("subtitle")}</p>
        </div>
        <Link href={`/calendar?month=${initialMonth}&date=${initialDate}`}>
          <Button>{t("today")}</Button>
        </Link>
      </header>

      <div className={styles.layout}>
        <section className={styles.calendarCard}>
          <header className={styles.calendarHeader}>
            <Link href={`/calendar?month=${previousMonth}`}>
              <Button
                type="text"
                icon={<LeftOutlined />}
                aria-label={t("previousMonth")}
              />
            </Link>
            <h2>{monthLabel}</h2>
            <Link href={`/calendar?month=${nextMonth}`}>
              <Button
                type="text"
                icon={<RightOutlined />}
                aria-label={t("nextMonth")}
              />
            </Link>
          </header>

          <div className={styles.weekHeader}>
            {weekDays.map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>

          <div className={styles.calendarGrid}>
            {days.map((day) => (
              <Link
                key={day.date}
                href={`/calendar?month=${visible.value}&date=${day.date}`}
                className={[
                  styles.day,
                  !day.inCurrentMonth ? styles.outside : "",
                  day.isToday ? styles.today : "",
                  day.date === selectedDate ? styles.selected : "",
                  day.summary ? styles.completed : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                aria-label={
                  day.summary
                    ? t("dayWithPractice", {
                        date: day.date,
                        count: day.summary.practiceCount,
                      })
                    : day.date
                }
              >
                <span>{day.day}</span>
                {day.summary && (
                  <i title={t("minutesValue", { count: day.summary.durationMinutes })}>
                    {day.summary.durationMinutes}
                  </i>
                )}
              </Link>
            ))}
          </div>
        </section>

        <aside className={styles.detailCard}>
          <header>
            <span>{t("selectedDate")}</span>
            <h2>{selectedLabel}</h2>
          </header>

          {selectedSummary ? (
            <>
              <div className={styles.dailyStats}>
                <article>
                  <ClockCircleOutlined />
                  <span>{t("duration")}</span>
                  <strong>{selectedSummary.durationMinutes}</strong>
                </article>
                <article>
                  <BookOutlined />
                  <span>{t("newExpressions")}</span>
                  <strong>{selectedSummary.newExpressions}</strong>
                </article>
                <article>
                  <FormOutlined />
                  <span>{t("corrections")}</span>
                  <strong>{selectedSummary.corrections}</strong>
                </article>
              </div>
              <div className={styles.dailyRecords}>
                {selectedRecords.map((record) => {
                  const scene =
                    mockScenes.find((item) => item.id === record.sceneId) ??
                    mockScenes[0];
                  return (
                    <Link
                      href={`/practice/${record.conversationId}/review`}
                      key={record.id}
                    >
                      <SceneCover
                        compact
                        label={scene.title[locale]}
                        mark={scene.coverMark}
                        tone={scene.coverTone}
                      />
                      <span>
                        <strong>{scene.title[locale]}</strong>
                        <small>
                          {t("recordSummary", {
                            minutes: record.durationMinutes,
                            expressions: record.newExpressions,
                          })}
                        </small>
                      </span>
                      <RightOutlined />
                    </Link>
                  );
                })}
              </div>
            </>
          ) : (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={t("emptyDay")}
            >
              <Link href="/scenes">
                <Button type="primary">{t("startPractice")}</Button>
              </Link>
            </Empty>
          )}
        </aside>
      </div>
    </main>
  );
}

export default function CalendarPage() {
  const t = useTranslations("Calendar");
  return (
    <Suspense
      fallback={
        <main className={styles.page} aria-busy="true">
          <header className={styles.pageHeader}>
            <div>
              <span>{t("eyebrow")}</span>
              <h1>{t("title")}</h1>
              <p>{t("subtitle")}</p>
            </div>
          </header>
          <div className={styles.loadingCard} />
        </main>
      }
    >
      <CalendarContent />
    </Suspense>
  );
}
