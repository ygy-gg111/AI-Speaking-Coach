"use client";

import {
  CheckCircleFilled,
  CustomerServiceOutlined,
  PauseCircleFilled,
  PlayCircleFilled,
  WarningFilled,
} from "@ant-design/icons";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

import type { AppLocale } from "@/i18n/routing";

import type { ConversationMessage } from "../types";
import styles from "./message-bubble.module.css";

type MessageBubbleProps = {
  message: ConversationMessage;
};

export function MessageBubble({ message }: MessageBubbleProps) {
  const locale = useLocale() as AppLocale;
  const t = useTranslations("Practice");
  const [playing, setPlaying] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isAssistant = message.role === "assistant";

  useEffect(
    () => () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    },
    [],
  );

  function togglePlayback() {
    if (playing) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      setPlaying(false);
      return;
    }

    setPlaying(true);
    timerRef.current = setTimeout(() => setPlaying(false), 1800);
  }

  return (
    <article
      className={`${styles.message} ${
        isAssistant ? styles.assistant : styles.user
      }`}
    >
      {isAssistant && (
        <div className={styles.avatar} aria-hidden="true">
          <CustomerServiceOutlined />
        </div>
      )}

      <div className={styles.messageColumn}>
        {isAssistant && <span className={styles.author}>Sarah</span>}
        <div className={styles.bubble}>
          <p>{message.text[locale]}</p>
          {message.audioAvailable && (
            <button
              type="button"
              className={styles.audioButton}
              onClick={togglePlayback}
              aria-label={playing ? t("pauseAudio") : t("playAudio")}
              aria-pressed={playing}
            >
              {playing ? <PauseCircleFilled /> : <PlayCircleFilled />}
            </button>
          )}
        </div>

        {message.translation && (
          <>
            <button
              type="button"
              className={styles.translationToggle}
              onClick={() => setShowTranslation((current) => !current)}
            >
              {showTranslation ? t("hideTranslation") : t("showTranslation")}
            </button>
            {showTranslation && (
              <p className={styles.translation}>
                {message.translation[locale]}
              </p>
            )}
          </>
        )}

        {message.correction && (
          <div className={styles.correction}>
            <span>
              <WarningFilled /> {t("needsImprovement")}
            </span>
            <strong>
              <CheckCircleFilled /> {message.correction.improved}
            </strong>
          </div>
        )}
      </div>
    </article>
  );
}
