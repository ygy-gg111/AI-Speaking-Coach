"use client";

import {
  ArrowLeftOutlined,
  CloseOutlined,
  CustomerServiceOutlined,
  SwapOutlined,
} from "@ant-design/icons";
import { Alert, Button } from "antd";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { CoachEvaluationPanel } from "@/features/correction/components/coach-evaluation-panel";
import { useConversationReview } from "@/features/correction/hooks/use-conversation-review";
import { useRealtimeSession } from "@/features/realtime/hooks/use-realtime-session";
import { SceneCover } from "@/features/scenes/components/scene-cover";
import { mockScenes } from "@/features/scenes/mock-scenes";
import { createMistakeFromEvaluation } from "@/features/mistakes/mistake-data";
import { Link, useRouter } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { useRealtimeStore } from "@/stores/realtime-store";
import { useLearningStore } from "@/stores/learning-store";

import { mockConversationMessages, mockEvaluation } from "../mock-conversation";
import { ConversationTimeline } from "./conversation-timeline";
import { VoiceControlBar } from "../../realtime/components/voice-control-bar";
import styles from "./practice-session.module.css";

type PracticeSessionProps = {
  conversationId: string;
};

export function PracticeSession({ conversationId }: PracticeSessionProps) {
  const locale = useLocale() as AppLocale;
  const t = useTranslations("Practice");
  const router = useRouter();
  const state = useRealtimeStore((store) => store.state);
  const transcript = useRealtimeStore((store) => store.transcript);
  const resetRealtime = useRealtimeStore((store) => store.reset);
  const addPracticeRecord = useLearningStore(
    (store) => store.addPracticeRecord,
  );
  const addMistake = useLearningStore((store) => store.addMistake);
  const [hint, setHint] = useState<string | null>(null);
  const [isEnding, setIsEnding] = useState(false);
  const startedAtRef = useRef<number | null>(null);
  const lastAnalyzedTurnRef = useRef("");
  const scene = mockScenes[1];
  const realtimeOptions = useMemo(
    () => ({
      conversationId,
      sceneName: scene.title.en,
      learnerLevel: "A2",
    }),
    [conversationId, scene.title.en],
  );
  const { connect, disconnect, error, sendText, toggleMicrophone } =
    useRealtimeSession(realtimeOptions);
  const {
    analyze,
    error: analysisError,
    isAnalyzing,
    review,
  } = useConversationReview(realtimeOptions);
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
  const reviewMessages = useMemo(
    () =>
      messages.map((message) => ({
        role: message.role,
        text: message.text.en,
      })),
    [messages],
  );
  const completedUserTurns = useMemo(
    () =>
      transcript
        .filter((item) => item.role === "user" && item.final)
        .map((item) => `${item.id}:${item.text}`)
        .join("|"),
    [transcript],
  );

  const analyzeCurrentConversation = useCallback(
    () => {
      const startedAt = startedAtRef.current ?? Date.now();
      return analyze(
        reviewMessages,
        Math.max(1, Math.round((Date.now() - startedAt) / 1_000)),
      );
    },
    [analyze, reviewMessages],
  );

  useEffect(() => {
    startedAtRef.current = Date.now();
    resetRealtime();
  }, [resetRealtime]);

  useEffect(() => {
    if (
      state !== "listening" ||
      !completedUserTurns ||
      completedUserTurns === lastAnalyzedTurnRef.current
    ) {
      return;
    }

    lastAnalyzedTurnRef.current = completedUserTurns;
    void analyzeCurrentConversation().catch(() => undefined);
  }, [analyzeCurrentConversation, completedUserTurns, state]);

  function handleMicrophone() {
    toggleMicrophone();
  }

  function handleSend(text: string) {
    if (sendText(text)) {
      setHint(null);
    }
  }

  async function endPractice() {
    setIsEnding(true);
    disconnect();
    let finalReview = review;
    try {
      finalReview = await analyzeCurrentConversation();
    } catch {
      // The review route still has the local fallback already shown in the UI.
    } finally {
      const evaluation = finalReview?.evaluation ?? mockEvaluation;
      addPracticeRecord({
        id: `practice-${conversationId}`,
        conversationId,
        sceneId: scene.id,
        completedAt: new Date().toISOString(),
        durationMinutes: evaluation.durationMinutes,
        newExpressions: evaluation.newExpressions,
        corrections: evaluation.corrections,
        mastery: Math.max(
          35,
          Math.min(
            95,
            78 - evaluation.corrections * 4 + evaluation.newExpressions,
          ),
        ),
      });
      addMistake(
        createMistakeFromEvaluation(conversationId, scene.id, evaluation),
      );
      router.push(`/practice/${conversationId}/review`);
    }
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
            loading={isEnding}
            onClick={() => void endPractice()}
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
            evaluation={review?.evaluation ?? mockEvaluation}
            analysisStatus={
              isAnalyzing
                ? "loading"
                : analysisError
                  ? "error"
                  : review?.source === "ai"
                    ? "ready"
                    : review
                      ? "fallback"
                      : "idle"
            }
            onAnalysisRetry={() =>
              void analyzeCurrentConversation().catch(() => undefined)
            }
            onRetry={() => setHint("I want to go to Japan.")}
          />
        </aside>
      </div>
    </main>
  );
}
