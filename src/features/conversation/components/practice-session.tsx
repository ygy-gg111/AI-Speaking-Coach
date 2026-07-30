"use client";

import {
  ArrowLeftOutlined,
  CloseOutlined,
  CustomerServiceOutlined,
  SwapOutlined,
} from "@ant-design/icons";
import { Alert, Button } from "antd";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";

import { CoachEvaluationPanel } from "@/features/correction/components/coach-evaluation-panel";
import { useRealtimeSession } from "@/features/realtime/hooks/use-realtime-session";
import { SceneCover } from "@/features/scenes/components/scene-cover";
import { mockScenes } from "@/features/scenes/mock-scenes";
import { Link, useRouter } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { useRealtimeStore } from "@/stores/realtime-store";

import { mockConversationMessages, mockEvaluation } from "../mock-conversation";
import { ConversationTimeline } from "./conversation-timeline";
import { VoiceControlBar } from "../../realtime/components/voice-control-bar";
import styles from "./practice-session.module.css";

export function PracticeSession() {
  const locale = useLocale() as AppLocale;
  const t = useTranslations("Practice");
  const router = useRouter();
  const state = useRealtimeStore((store) => store.state);
  const transcript = useRealtimeStore((store) => store.transcript);
  const resetRealtime = useRealtimeStore((store) => store.reset);
  const [hint, setHint] = useState<string | null>(null);
  const scene = mockScenes[1];
  const realtimeOptions = useMemo(
    () => ({
      conversationId: "practice-demo",
      sceneName: scene.title.en,
      learnerLevel: "A2",
    }),
    [scene.title.en],
  );
  const { connect, disconnect, error, sendText, toggleMicrophone } =
    useRealtimeSession(realtimeOptions);
  const messages = useMemo(
    () => [
      ...mockConversationMessages,
      ...transcript.map((item) => ({
        id: item.id,
        role: item.role,
        text: { "zh-CN": item.text, en: item.text },
        audioAvailable: item.role === "assistant",
      })),
    ],
    [transcript],
  );

  useEffect(() => {
    resetRealtime();
  }, [resetRealtime]);

  function handleMicrophone() {
    toggleMicrophone();
  }

  function handleSend(text: string) {
    if (sendText(text)) {
      setHint(null);
    }
  }

  function endPractice() {
    disconnect();
    router.push("/practice/demo/review");
  }

  return (
    <main className={styles.page}>
      <header className={styles.topBar}>
        <Link href="/scenes" className={styles.backButton} aria-label={t("back")}>
          <ArrowLeftOutlined />
        </Link>
        <div className={styles.sceneTitle}>
          <strong>{scene.title[locale]}</strong>
          <span>{t("beginner")}</span>
        </div>
        <div className={styles.headerActions}>
          <Link href="/scenes">
            <Button type="text" icon={<SwapOutlined />}>
              {t("switchScene")}
            </Button>
          </Link>
          <Button
            type="text"
            danger
            icon={<CloseOutlined />}
            onClick={endPractice}
          >
            {t("endPractice")}
          </Button>
        </div>
      </header>

      <div className={styles.practiceGrid}>
        <section className={styles.conversationCard}>
          <div className={styles.coachHeader}>
            <div className={styles.coachAvatar}>
              <CustomerServiceOutlined />
            </div>
            <div>
              <strong>Sarah</strong>
              <span>{t("airportStaff")}</span>
            </div>
            <div className={styles.sceneMini}>
              <SceneCover
                compact
                label={scene.title[locale]}
                mark={scene.coverMark}
                tone={scene.coverTone}
              />
            </div>
          </div>

          <ConversationTimeline
            messages={messages}
            thinkingLabel={state === "ai-thinking" ? t("aiThinking") : undefined}
          />

          {error && (
            <Alert
              className={styles.realtimeAlert}
              type="warning"
              showIcon
              message={t("connectionErrorTitle")}
              description={t("connectionErrorDetail")}
              action={
                <Button size="small" onClick={() => void connect()}>
                  {t("retryConnection")}
                </Button>
              }
            />
          )}

          {hint && (
            <div className={styles.hint} role="status">
              <span>{t("hintTitle")}</span>
              <strong>{hint}</strong>
            </div>
          )}

          <VoiceControlBar
            state={state}
            statusLabel={t(`state.${state}`)}
            hintLabel={t("hint")}
            cantSayLabel={t("cantSay")}
            inputPlaceholder={t("inputPlaceholder")}
            sendLabel={t("send")}
            microphoneLabel={t("microphone")}
            onMicrophone={handleMicrophone}
            onCantSay={() => setHint("I am traveling for vacation.")}
            onHint={() => setHint("business / vacation")}
            onSend={handleSend}
          />
        </section>

        <aside className={styles.evaluationColumn}>
          <CoachEvaluationPanel
            evaluation={mockEvaluation}
            onRetry={() => setHint("I want to go to Japan.")}
          />
        </aside>
      </div>
    </main>
  );
}
