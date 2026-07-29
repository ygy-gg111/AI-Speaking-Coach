"use client";

import {
  ClockCircleOutlined,
  HeartFilled,
  HeartOutlined,
  StarFilled,
  StarOutlined,
} from "@ant-design/icons";
import { Button } from "antd";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import { Link } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";

import type { Scene, SceneCardVariant } from "../types";
import { SceneCover } from "./scene-cover";
import styles from "./scene-card.module.css";

type SceneCardProps = {
  scene: Scene;
  variant?: SceneCardVariant;
};

export function SceneCard({ scene, variant = "grid" }: SceneCardProps) {
  const locale = useLocale() as AppLocale;
  const t = useTranslations("Scenes");
  const [favorite, setFavorite] = useState(scene.favorite);
  const title = scene.title[locale];
  const compact = variant === "compact";

  return (
    <article
      className={`${styles.card} ${styles[variant]}`}
      data-variant={variant}
    >
      <SceneCover
        label={title}
        mark={scene.coverMark}
        tone={scene.coverTone}
        compact={compact}
      />

      <div className={styles.body}>
        <div className={styles.titleRow}>
          <div>
            <h3>{title}</h3>
            {!compact && <p>{scene.subtitle[locale]}</p>}
          </div>
          <button
            type="button"
            className={styles.favorite}
            aria-label={favorite ? t("removeFavorite") : t("addFavorite")}
            onClick={() => setFavorite((current) => !current)}
          >
            {favorite ? <HeartFilled /> : <HeartOutlined />}
          </button>
        </div>

        <div className={styles.meta}>
          <span className={styles.stars} aria-label={t("difficultyValue", { value: scene.difficulty })}>
            {[1, 2, 3, 4, 5].map((value) =>
              value <= scene.difficulty ? (
                <StarFilled key={value} />
              ) : (
                <StarOutlined key={value} />
              ),
            )}
          </span>
          <span>
            <ClockCircleOutlined /> {scene.estimatedMinutes} {t("minutes")}
          </span>
        </div>

        {compact ? (
          <Link
            href={`/practice/demo?scene=${scene.slug}`}
            className={styles.compactLink}
            aria-label={t("startScene", { title })}
          />
        ) : (
          <Link href={`/practice/demo?scene=${scene.slug}`}>
            <Button type="primary" block className={styles.startButton}>
              {t("start")}
            </Button>
          </Link>
        )}
      </div>
    </article>
  );
}
