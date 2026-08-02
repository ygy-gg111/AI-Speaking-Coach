"use client";

import {
  CheckCircleFilled,
  CheckOutlined,
  CloseCircleFilled,
  ReloadOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { Button, Empty, Input, Tabs, Tag } from "antd";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import {
  filterMistakes,
  type MistakeFilter,
} from "@/features/mistakes/mistake-data";
import type { MistakeCategory } from "@/features/mistakes/types";
import {
  useCloudMistakes,
  useReviewMistake,
} from "@/features/mistakes/hooks/use-cloud-mistakes";
import { mockScenes } from "@/features/scenes/mock-scenes";
import { Link } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { useLearningStore } from "@/stores/learning-store";

import styles from "./mistakes.module.css";

export default function MistakesPage() {
  const locale = useLocale() as AppLocale;
  const t = useTranslations("Mistakes");
  const mistakes = useLearningStore((store) => store.mistakes);
  useCloudMistakes();
  const reviewMistake = useReviewMistake();
  const [filter, setFilter] = useState<MistakeFilter>("all");
  const [query, setQuery] = useState("");
  const visibleMistakes = useMemo(
    () => filterMistakes(mistakes, filter, query),
    [filter, mistakes, query],
  );
  const learningCount = mistakes.filter(
    (mistake) => mistake.status === "learning",
  ).length;
  const masteredCount = mistakes.length - learningCount;
  const formatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        month: "short",
        day: "numeric",
      }),
    [locale],
  );
  const categories: MistakeFilter[] = [
    "all",
    "grammar",
    "vocabulary",
    "expression",
  ];

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <span>{t("eyebrow")}</span>
          <h1>{t("title")}</h1>
          <p>{t("subtitle")}</p>
        </div>
        <Link href="/practice">
          <Button type="primary" icon={<ReloadOutlined />} size="large">
            {t("startReview")}
          </Button>
        </Link>
      </header>

      <section className={styles.summary} aria-label={t("summaryLabel")}>
        <article>
          <span>{t("total")}</span>
          <strong>{mistakes.length}</strong>
        </article>
        <article>
          <span>{t("toReview")}</span>
          <strong>{learningCount}</strong>
        </article>
        <article>
          <span>{t("mastered")}</span>
          <strong>{masteredCount}</strong>
        </article>
      </section>

      <section className={styles.library}>
        <div className={styles.tools}>
          <Tabs
            activeKey={filter}
            onChange={(key) => setFilter(key as MistakeFilter)}
            items={categories.map((category) => ({
              key: category,
              label: t(`filter.${category}`),
            }))}
          />
          <Input
            allowClear
            prefix={<SearchOutlined />}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("searchPlaceholder")}
            aria-label={t("searchLabel")}
          />
        </div>

        {visibleMistakes.length ? (
          <div className={styles.list} aria-live="polite">
            {visibleMistakes.map((mistake) => {
              const scene = mockScenes.find(
                (item) => item.id === mistake.sceneId,
              );
              const practiceHref =
                `/practice/${mistake.conversationId}` as const;
              return (
                <article className={styles.mistakeCard} key={mistake.id}>
                  <header>
                    <div>
                      <Tag
                        color={getCategoryColor(mistake.category)}
                        variant="filled"
                      >
                        {t(`category.${mistake.category}`)}
                      </Tag>
                      <span className={styles.sceneName}>
                        {scene?.title[locale] ?? t("unknownScene")}
                      </span>
                    </div>
                    <time dateTime={mistake.createdAt}>
                      {formatter.format(new Date(mistake.createdAt))}
                    </time>
                  </header>

                  <div className={styles.comparison}>
                    <div className={styles.original}>
                      <span>
                        <CloseCircleFilled /> {t("original")}
                      </span>
                      <strong>{mistake.original}</strong>
                    </div>
                    <div className={styles.improved}>
                      <span>
                        <CheckCircleFilled /> {t("improved")}
                      </span>
                      <strong>{mistake.improved}</strong>
                    </div>
                  </div>

                  <p className={styles.reason}>{mistake.reason[locale]}</p>

                  <footer>
                    <div className={styles.reviewState}>
                      <span
                        className={
                          mistake.status === "mastered"
                            ? styles.mastered
                            : styles.learning
                        }
                      >
                        {t(`status.${mistake.status}`)}
                      </span>
                      <span>
                        {t("reviewCount", { count: mistake.reviewCount })}
                      </span>
                    </div>
                    <div className={styles.actions}>
                      <Button
                        icon={<CheckOutlined />}
                        disabled={mistake.status === "mastered"}
                        onClick={() => reviewMistake(mistake.id)}
                        aria-label={t("markReviewedLabel", {
                          expression: mistake.improved,
                        })}
                      >
                        {mistake.status === "mastered"
                          ? t("mastered")
                          : t("markReviewed")}
                      </Button>
                      <Link href={practiceHref}>
                        <Button type="primary">{t("practiceAgain")}</Button>
                      </Link>
                      <Link href={`/mistakes/${mistake.id}`}>
                        <Button>{t("viewDetail")}</Button>
                      </Link>
                    </div>
                  </footer>
                </article>
              );
            })}
          </div>
        ) : (
          <Empty
            className={styles.empty}
            description={t(query ? "emptySearch" : "emptyCategory")}
          />
        )}
      </section>
    </main>
  );
}

function getCategoryColor(category: MistakeCategory) {
  return {
    grammar: "purple",
    vocabulary: "blue",
    expression: "orange",
  }[category];
}
