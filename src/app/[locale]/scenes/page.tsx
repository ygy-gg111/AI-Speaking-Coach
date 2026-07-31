"use client";

import { SearchOutlined } from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { Empty, Input } from "antd";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { SceneCard } from "@/features/scenes/components/scene-card";
import { getScenes } from "@/features/scenes/scene-client";
import { mockScenes } from "@/features/scenes/mock-scenes";
import type { SceneCategory } from "@/features/scenes/types";

import styles from "./scenes.module.css";

type CategoryKey = "all" | SceneCategory;

const categories: CategoryKey[] = [
  "all",
  "daily",
  "travel",
  "work",
  "education",
  "social",
];

export default function ScenesPage() {
  const t = useTranslations("Scenes");
  const [category, setCategory] = useState<CategoryKey>("all");
  const [keyword, setKeyword] = useState("");

  const sceneQuery = useQuery({
    queryKey: ["scenes", category, keyword.trim()],
    queryFn: () =>
      getScenes({
        category: category === "all" ? undefined : category,
        query: keyword,
      }),
    retry: false,
    staleTime: 5 * 60 * 1_000,
  });

  const fallbackScenes = useMemo(() => {
    const query = keyword.trim().toLocaleLowerCase();
    return mockScenes.filter((scene) => {
      const matchesCategory =
        category === "all" || scene.category === category;
      const matchesKeyword =
        !query ||
        Object.values(scene.title).some((title) =>
          title.toLocaleLowerCase().includes(query),
        ) ||
        Object.values(scene.subtitle).some((subtitle) =>
          subtitle.toLocaleLowerCase().includes(query),
        );
      return matchesCategory && matchesKeyword;
    });
  }, [category, keyword]);
  const scenes = sceneQuery.data ?? fallbackScenes;

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <span className={styles.eyebrow}>{t("eyebrow")}</span>
          <h1>{t("title")}</h1>
          <p>{t("subtitle")}</p>
        </div>
        <span className={styles.today}>{t("today")}</span>
      </header>

      <div className={styles.toolbar}>
        <Input
          allowClear
          size="large"
          prefix={<SearchOutlined />}
          placeholder={t("searchPlaceholder")}
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          className={styles.search}
          aria-label={t("searchPlaceholder")}
        />
      </div>

      <section className={styles.content}>
        <aside className={styles.categories} aria-label={t("categories")}>
          <span>{t("categories")}</span>
          {categories.map((item) => (
            <button
              type="button"
              key={item}
              className={category === item ? styles.categoryActive : ""}
              onClick={() => setCategory(item)}
            >
              {t(`category.${item}`)}
            </button>
          ))}
        </aside>

        <div className={styles.results}>
          <div className={styles.mobileCategories}>
            {categories.map((item) => (
              <button
                type="button"
                key={item}
                className={category === item ? styles.categoryActive : ""}
                onClick={() => setCategory(item)}
              >
                {t(`category.${item}`)}
              </button>
            ))}
          </div>

          <div className={styles.resultHeader}>
            <strong>{t("resultTitle")}</strong>
            <span>{t("resultCount", { count: scenes.length })}</span>
          </div>

          {scenes.length > 0 ? (
            <div className={styles.grid}>
              {scenes.map((scene) => (
                <SceneCard scene={scene} key={scene.id} />
              ))}
            </div>
          ) : (
            <div className={styles.empty}>
              <Empty description={t("empty")} />
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
