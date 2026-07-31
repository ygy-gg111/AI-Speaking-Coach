"use client";

import { ArrowRightOutlined, AudioOutlined } from "@ant-design/icons";
import { useLocale, useTranslations } from "next-intl";

import { StartPracticeButton } from "@/features/conversation/components/start-practice-button";
import { SceneCard } from "@/features/scenes/components/scene-card";
import { SceneCover } from "@/features/scenes/components/scene-cover";
import { mockScenes } from "@/features/scenes/mock-scenes";
import { Link } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";

import styles from "./practice.module.css";

export default function PracticePage() {
  const t = useTranslations("Practice");
  const locale = useLocale() as AppLocale;
  const currentScene = mockScenes[1];

  return (
    <main className={styles.page}>
      <header>
        <span>{t("eyebrow")}</span>
        <h1>{t("practiceHomeTitle")}</h1>
        <p>{t("practiceHomeSubtitle")}</p>
      </header>

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
          <div className={styles.progress}>
            <i />
          </div>
          <small>{t("progress", { value: 65 })}</small>
          <StartPracticeButton
            scene={currentScene}
            className={styles.continueButton}
          >
            <AudioOutlined />
            {t("continuePractice")}
          </StartPracticeButton>
        </div>
      </section>

      <section className={styles.quickScenes}>
        <div className={styles.sectionHeader}>
          <h2>{t("quickScenes")}</h2>
          <Link href="/scenes">
            {t("allScenes")} <ArrowRightOutlined />
          </Link>
        </div>
        <div className={styles.sceneList}>
          {mockScenes.slice(0, 4).map((scene) => (
            <SceneCard scene={scene} variant="compact" key={scene.id} />
          ))}
        </div>
      </section>
    </main>
  );
}
