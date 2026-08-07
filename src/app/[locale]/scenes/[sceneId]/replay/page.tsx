"use client";

import {
  ArrowLeftOutlined,
  AudioOutlined,
  PauseOutlined,
  PlayCircleFilled,
} from "@ant-design/icons";
import { Button, Empty, Segmented, Select, Slider, Spin, Switch } from "antd";
import { useLocale, useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useState } from "react";

import { useSceneCatalog } from "@/features/scenes/hooks/use-scene-catalog";
import { getSceneDetail } from "@/features/scenes/scene-detail-data";
import { scorePronunciation, type PronunciationScore } from "@/features/realtime/pronunciation-score";
import { Link } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";

import styles from "../../../feature-pages.module.css";

export default function SceneReplayPage() {
  const locale = useLocale() as AppLocale;
  const t = useTranslations("Replay");
  const params = useParams<{ sceneId: string }>();
  const sceneQuery = useSceneCatalog();
  const scene = sceneQuery.data?.find(
    (item) => item.id === params.sceneId || item.slug === params.sceneId,
  );
  const [playing, setPlaying] = useState(false);
  const [mode, setMode] = useState("sentence");
  const [showTranslation, setShowTranslation] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [pronunciation, setPronunciation] = useState<PronunciationScore | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  if (sceneQuery.isPending) return <Spin fullscreen size="large" />;
  if (!scene) return <Empty description="Scene not found" />;
  const detail = getSceneDetail(scene.id);

  function speak(text: string) {
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = speed;
    utterance.onend = () => setPlaying(false);
    setPlaying(true);
    speechSynthesis.speak(utterance);
  }

  function togglePlayback() {
    if (playing) {
      speechSynthesis.cancel();
      setPlaying(false);
      return;
    }
    speak(detail.phrases.map((phrase) => phrase.expression).join(" "));
  }

  function startShadowing(target: string) {
    type RecognitionResultEvent = { results: { 0: { 0: { transcript: string } } } };
    type Recognition = {
      lang: string;
      interimResults: boolean;
      onresult: ((event: RecognitionResultEvent) => void) | null;
      onerror: (() => void) | null;
      onend: (() => void) | null;
      start: () => void;
    };
    const RecognitionConstructor = (window as unknown as {
      SpeechRecognition?: new () => Recognition;
      webkitSpeechRecognition?: new () => Recognition;
    }).SpeechRecognition ?? (window as unknown as { webkitSpeechRecognition?: new () => Recognition }).webkitSpeechRecognition;
    if (!RecognitionConstructor) return;
    const recognition = new RecognitionConstructor();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      setPronunciation(scorePronunciation(target, event.results[0][0].transcript));
    };
    recognition.onerror = () => setIsRecording(false);
    recognition.onend = () => setIsRecording(false);
    setIsRecording(true);
    recognition.start();
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <Link href={`/scenes/${scene.id}`}>
            <Button type="text" icon={<ArrowLeftOutlined />}>
              {t("back")}
            </Button>
          </Link>
          <span>{t("eyebrow")}</span>
          <h1>{scene.title[locale]}</h1>
          <p>{t("subtitle")}</p>
        </div>
        <Link href={`/practice/${crypto.randomUUID()}?scene=${scene.slug}`}>
          <Button type="primary" size="large" icon={<AudioOutlined />}>
            {t("practice")}
          </Button>
        </Link>
      </header>

      <section className={styles.card}>
        <div className={styles.header}>
          <Segmented
            value={mode}
            onChange={(value) => setMode(String(value))}
            options={[
              { value: "full", label: t("mode.full") },
              { value: "sentence", label: t("mode.sentence") },
              { value: "shadow", label: t("mode.shadow") },
            ]}
          />
          <div>
            <span className={styles.muted}>{t("translation")}</span>{" "}
            <Switch
              checked={showTranslation}
              onChange={setShowTranslation}
            />
          </div>
        </div>
        <div className={styles.list}>
          {detail.phrases.map((phrase, index) => (
            <article className={styles.listItem} key={phrase.expression}>
              <div>
                <span className={styles.muted}>
                  {t("sentence", { index: index + 1 })}
                </span>
                <h3 className={styles.phrase}>{phrase.expression}</h3>
                {showTranslation && <p>{phrase.meaning[locale]}</p>}
              </div>
              <Button
                shape="circle"
                icon={<PlayCircleFilled />}
                aria-label={t("playSentence", { index: index + 1 })}
                onClick={() => speak(phrase.expression)}
              />
              {mode === "shadow" && (
                <Button loading={isRecording} onClick={() => startShadowing(phrase.expression)}>
                  {t("shadowRecord")}
                </Button>
              )}
            </article>
          ))}
        </div>
        {pronunciation && (
          <div className={styles.card} role="status">
            <h3>{t("pronunciationScore", { score: pronunciation.score })}</h3>
            <p>{t("matchedWords")}: {pronunciation.matchedWords.join(", ") || "-"}</p>
            <p>{t("needsPractice")}: {pronunciation.needsPractice.join(", ") || "-"}</p>
          </div>
        )}
        <div className={styles.player}>
          <Button
            type="primary"
            shape="circle"
            size="large"
            icon={playing ? <PauseOutlined /> : <PlayCircleFilled />}
            onClick={togglePlayback}
            aria-label={playing ? t("pause") : t("play")}
          />
          <Slider value={playing ? 36 : 0} tooltip={{ open: false }} />
          <Select
            aria-label={t("speed")}
            value={String(speed)}
            onChange={(value) => setSpeed(Number(value))}
            options={[
              { value: "0.75", label: "0.75×" },
              { value: "1", label: "1.0×" },
              { value: "1.25", label: "1.25×" },
            ]}
          />
        </div>
      </section>
    </main>
  );
}
