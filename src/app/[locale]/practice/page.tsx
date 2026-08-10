"use client";

import {
  ArrowRightOutlined,
  AudioOutlined,
  CommentOutlined,
  FormOutlined,
  SoundOutlined,
} from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { Empty, Skeleton } from "antd";
import { useLocale, useTranslations } from "next-intl";

import { StartPracticeButton } from "@/features/conversation/components/start-practice-button";
import { getDashboard } from "@/features/dashboard/dashboard-client";
import { SceneCard } from "@/features/scenes/components/scene-card";
import { SceneCover } from "@/features/scenes/components/scene-cover";
import { getScenes } from "@/features/scenes/scene-client";
import { Link } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";

import styles from "./practice.module.css";

export default function PracticePage() {
  const t = useTranslations("Practice");
  const locale = useLocale() as AppLocale;
  const timezoneOffset = new Date().getTimezoneOffset();
  const scenesQuery = useQuery({
    queryKey: ["scenes"],
    queryFn: () => getScenes(),
    retry: false,
    staleTime: 5 * 60 * 1_000,
  });
  const dashboardQuery = useQuery({
    queryKey: ["dashboard", timezoneOffset],
    queryFn: () => getDashboard(timezoneOffset),
    retry: false,
    staleTime: 60 * 1_000,
  });
  const scenes = scenesQuery.data ?? [];
  const recentRecord = dashboardQuery.data?.recentRecord;
  const currentScene =
    scenes.find((scene) => scene.id === recentRecord?.sceneId) ?? scenes[0];
  const progress = recentRecord?.mastery ?? 0;

  return (
    <main className={styles.page}>
      <header>
        <span>{t("eyebrow")}</span>
        <h1>{t("practiceHomeTitle")}</h1>
        <p>{t("practiceHomeSubtitle")}</p>
      </header>

      {scenesQuery.isLoading ? (
        <Skeleton active />
      ) : currentScene ? (
        <section className={styles.continueCard}>
          <SceneCover
            label={currentScene.title[locale]}
            mark={currentScene.coverMark}
            tone={currentScene.coverTone}
          />
          <div className={styles.continueBody}>
            <span>{t("continueLabel")}</span>
            <h2>{currentScene.title[locale]}</h2>
            <p>{currentScene.subtitle[locale]}</p>
            {recentRecord && (
              <>
                <div className={styles.progress}>
                  <i style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} />
                </div>
                <small>{t("progress", { value: progress })}</small>
              </>
            )}
            <StartPracticeButton
              scene={currentScene}
              className={styles.continueButton}
            >
              <AudioOutlined />
              {t("continuePractice")}
            </StartPracticeButton>
          </div>
        </section>
      ) : (
        <Empty description={t("allScenes")} />
      )}

      {currentScene && (
        <section className={styles.trainingModes}>
          <div className={styles.trainingHeading}>
            <div>
              <span>{t("trainingEyebrow")}</span>
              <h2>{t("trainingModes")}</h2>
            </div>
            <p>{t("trainingModesSubtitle")}</p>
          </div>

          <div className={styles.trainingGrid}>
            <article className={`${styles.trainingCard} ${styles.conversationMode}`}>
              <div className={styles.trainingIcon}>
                <CommentOutlined />
              </div>
              <span>{t("modeConversationTag")}</span>
              <h3>{t("modeConversationTitle")}</h3>
              <p>{t("modeConversationDescription")}</p>
              <StartPracticeButton
                scene={currentScene}
                className={styles.trainingAction}
              >
                {t("modeConversationAction")} <ArrowRightOutlined />
              </StartPracticeButton>
            </article>

            <article className={`${styles.trainingCard} ${styles.shadowingMode}`}>
              <div className={styles.trainingIcon}>
                <SoundOutlined />
              </div>
              <span>{t("modeShadowingTag")}</span>
              <h3>{t("modeShadowingTitle")}</h3>
              <p>{t("modeShadowingDescription")}</p>
              <Link
                href={`/scenes/${currentScene.id}/replay`}
                className={styles.trainingAction}
              >
                {t("modeShadowingAction")} <ArrowRightOutlined />
              </Link>
            </article>

            <article className={`${styles.trainingCard} ${styles.reviewMode}`}>
              <div className={styles.trainingIcon}>
                <FormOutlined />
              </div>
              <span>{t("modeReviewTag")}</span>
              <h3>{t("modeReviewTitle")}</h3>
              <p>{t("modeReviewDescription")}</p>
              <Link href="/mistakes" className={styles.trainingAction}>
                {t("modeReviewAction")} <ArrowRightOutlined />
              </Link>
            </article>
          </div>
        </section>
      )}

      <section className={styles.quickScenes}>
        <div className={styles.sectionHeader}>
          <h2>{t("quickScenes")}</h2>
          <Link href="/scenes">
            {t("allScenes")} <ArrowRightOutlined />
          </Link>
        </div>
        <div className={styles.sceneList}>
          {scenes.slice(0, 4).map((scene) => (
            <SceneCard scene={scene} variant="compact" key={scene.id} />
          ))}
        </div>
      </section>
    </main>
  );
}
