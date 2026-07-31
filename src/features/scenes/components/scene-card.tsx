"use client";

import {
  ClockCircleOutlined,
  HeartFilled,
  HeartOutlined,
  StarFilled,
  StarOutlined,
} from "@ant-design/icons";
import { useLocale, useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";

import { StartPracticeButton } from "../../conversation/components/start-practice-button";
import { useSceneFavorite } from "../hooks/use-scene-favorite";
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
  const { favorite, isSyncing, toggle } = useSceneFavorite(scene.id);
  const title = scene.title[locale];
  const compact = variant === "compact";
  const detailHref = `/scenes/${scene.id}` as const;

  return (
    <article
      className={`${styles.card} ${styles[variant]}`}
      data-variant={variant}
    >
      {compact ? (
        <SceneCover
          label={title}
          mark={scene.coverMark}
          tone={scene.coverTone}
          compact
        />
      ) : (
        <Link href={detailHref} aria-label={t("viewDetails")}>
          <SceneCover
            label={title}
            mark={scene.coverMark}
            tone={scene.coverTone}
          />
        </Link>
      )}

      <div className={styles.body}>
        <div className={styles.titleRow}>
          <div>
            <h3>
              {compact ? title : <Link href={detailHref}>{title}</Link>}
            </h3>
            {!compact && <p>{scene.subtitle[locale]}</p>}
          </div>
          <button
            type="button"
            className={styles.favorite}
            aria-label={favorite ? t("removeFavorite") : t("addFavorite")}
            aria-busy={isSyncing}
            onClick={toggle}
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
          <StartPracticeButton
            scene={scene}
            className={styles.compactLink}
            aria-label={t("startScene", { title })}
          />
        ) : (
          <div className={styles.actions}>
            <Link href={detailHref} className={styles.detailButton}>
              {t("viewDetails")}
            </Link>
            <StartPracticeButton scene={scene} className={styles.startButton}>
              {t("start")}
            </StartPracticeButton>
          </div>
        )}
      </div>
    </article>
  );
}
