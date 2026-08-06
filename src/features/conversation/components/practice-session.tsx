"use client";

import {
  ArrowLeftOutlined,
  CloseOutlined,
  CustomerServiceOutlined,
  SwapOutlined,
} from "@ant-design/icons";
import { Alert, Button } from "antd";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { CoachEvaluationPanel } from "@/features/correction/components/coach-evaluation-panel";
import { useConversationReview } from "@/features/correction/hooks/use-conversation-review";
import { getCurrentUser } from "@/features/auth";
import { useRealtimeSession } from "@/features/realtime/hooks/use-realtime-session";
import { SceneCover } from "@/features/scenes/components/scene-cover";
import { findScene, mockScenes } from "@/features/scenes/mock-scenes";
import { getSceneDetail } from "@/features/scenes/scene-detail-data";
import { getScene } from "@/features/scenes/scene-client";
import { createMistakeFromEvaluation } from "@/features/mistakes/mistake-data";
import { saveMistake } from "@/features/mistakes/mistake-client";
import { createVocabularyFromEvaluation } from "@/features/vocabulary/vocabulary-data";
import { saveVocabulary } from "@/features/vocabulary/vocabulary-client";
import { Link, useRouter } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { useRealtimeStore } from "@/stores/realtime-store";
import { useLearningStore } from "@/stores/learning-store";

import {
  createMockConversationMessages,
  mockEvaluation,
} from "../mock-conversation";
import {
  completeConversation,
  getConversation,
  isGuestConversation,
  saveConversationMessage,
} from "../conversation-client";
import { ConversationTimeline } from "./conversation-timeline";
import { VoiceControlBar } from "../../realtime/components/voice-control-bar";
import styles from "./practice-session.module.css";

type PracticeSessionProps = {
  conversationId: string;
  sceneIdentifier?: string;
};

export function PracticeSession({
  conversationId,
  sceneIdentifier,
}: PracticeSessionProps) {
  const locale = useLocale() as AppLocale;
  const t = useTranslations("Practice");
  const router = useRouter();
  const queryClient = useQueryClient();
  const state = useRealtimeStore((store) => store.state);
  const transcript = useRealtimeStore((store) => store.transcript);
  const resetRealtime = useRealtimeStore((store) => store.reset);
  const addPracticeRecord = useLearningStore(
    (store) => store.addPracticeRecord,
  );
  const addMistake = useLearningStore((store) => store.addMistake);
  const addVocabulary = useLearningStore((store) => store.addVocabulary);
  const [hint, setHint] = useState<string | null>(null);
  const [isEnding, setIsEnding] = useState(false);
  const startedAtRef = useRef<number | null>(null);
  const lastAnalyzedTurnRef = useRef("");
  const persistedMessageIdsRef = useRef(new Set<string>());
  const pendingSavesRef = useRef(new Set<Promise<void>>());
  const initialTranscriptIdsRef = useRef(
    new Set(useRealtimeStore.getState().transcript.map((item) => item.id)),
  );
  const guest = isGuestConversation(conversationId);
  const userQuery = useQuery({
    queryKey: ["current-user"],
    queryFn: getCurrentUser,
    enabled: !guest,
    retry: false,
  });
  const conversationQuery = useQuery({
    queryKey: ["conversation", conversationId],
    queryFn: () => getConversation(conversationId),
    enabled: !guest,
    retry: false,
  });
  const authoritativeSceneIdentifier =
    conversationQuery.data?.scene?.id ?? sceneIdentifier ?? "";
  const sceneQuery = useQuery({
    queryKey: ["scene", authoritativeSceneIdentifier],
    queryFn: () => getScene(authoritativeSceneIdentifier),
    enabled: Boolean(authoritativeSceneIdentifier),
    retry: false,
    staleTime: 5 * 60 * 1_000,
  });
  const scene =
    sceneQuery.data ??
    findScene(authoritativeSceneIdentifier) ??
    mockScenes[1];
  const sceneDetail = getSceneDetail(scene.id);
  const openingExpression = sceneDetail.phrases[0].expression;
  const initialMessages = useMemo(
    () => {
      const storedMessages = conversationQuery.data?.messages ?? [];
      if (storedMessages.length > 0) {
        return storedMessages
          .filter((message) => message.role !== "SYSTEM")
          .map((message) => ({
            id: message.id,
            role: message.role === "USER" ? "user" as const : "assistant" as const,
            text: {
              "zh-CN": message.transcript ?? message.content,
              en: message.transcript ?? message.content,
            },
            audioAvailable: message.role === "ASSISTANT",
          }));
      }
      return createMockConversationMessages({
        partnerName: sceneDetail.partner,
        openingExpression,
      });
    },
    [conversationQuery.data?.messages, openingExpression, sceneDetail.partner],
  );
  const realtimeOptions = useMemo(
    () => ({
      conversationId,
      sceneName: scene.title.en,
      learnerLevel: userQuery.data?.profile.level ?? "A2",
    }),
    [conversationId, scene.title.en, userQuery.data?.profile.level],
  );
  const { connect, disconnect, error, errorCode, sendText, toggleMicrophone } =
    useRealtimeSession(realtimeOptions);
  const {
    analyze,
    error: analysisError,
    isAnalyzing,
    review,
  } = useConversationReview(realtimeOptions);
  const messages = useMemo(
    () => [
      ...initialMessages,
      ...transcript.map((item) => ({
        id: item.id,
        role: item.role,
        text: { "zh-CN": item.text, en: item.text },
        audioAvailable: item.role === "assistant",
      })),
    ],
    [initialMessages, transcript],
  );
  const reviewMessages = useMemo(
    () => [
      ...(conversationQuery.data?.messages ?? [])
        .filter((message) => message.role !== "SYSTEM")
        .map((message) => ({
          role: message.role === "USER" ? "user" as const : "assistant" as const,
          text: message.transcript ?? message.content,
        })),
      ...transcript
        .filter((item) => item.final && item.text.trim())
        .map((item) => ({ role: item.role, text: item.text.trim() })),
    ],
    [conversationQuery.data?.messages, transcript],
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
    persistedMessageIdsRef.current.clear();
    resetRealtime();
  }, [resetRealtime]);

  useEffect(() => {
    if (conversationQuery.data?.status === "COMPLETED") {
      router.replace(
        `/practice/${conversationId}/review?scene=${encodeURIComponent(scene.slug)}`,
      );
    }
  }, [conversationId, conversationQuery.data?.status, router, scene.slug]);

  useEffect(() => {
    if (isGuestConversation(conversationId)) {
      return;
    }

    for (const item of transcript) {
      if (
        !item.final ||
        !item.text.trim() ||
        initialTranscriptIdsRef.current.has(item.id) ||
        persistedMessageIdsRef.current.has(item.id)
      ) {
        continue;
      }
      persistedMessageIdsRef.current.add(item.id);
      const pending = saveConversationMessage(conversationId, {
        clientEventId: item.id,
        role: item.role === "user" ? "USER" : "ASSISTANT",
        content: item.text.trim(),
        transcript: item.text.trim(),
      })
        .then(() => undefined)
        .catch(() => {
          persistedMessageIdsRef.current.delete(item.id);
        });
      pendingSavesRef.current.add(pending);
      void pending.finally(() => pendingSavesRef.current.delete(pending));
    }
  }, [conversationId, transcript]);

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
    const startedAt = startedAtRef.current ?? Date.now();
    const durationSeconds = Math.max(
      0,
      Math.min(60 * 60, Math.round((Date.now() - startedAt) / 1_000)),
    );
    try {
      if (!guest) {
        await Promise.allSettled([...pendingSavesRef.current]);
      }
      finalReview = await analyzeCurrentConversation();
    } catch {
      // The review route still has the local fallback already shown in the UI.
    } finally {
      const evaluation = finalReview?.evaluation ?? mockEvaluation;
      const mastery = Math.max(
        35,
        Math.min(
          95,
          78 - evaluation.corrections * 4 + evaluation.newExpressions,
        ),
      );
      let cloudMistake = null;
      let cloudVocabulary = null;
      if (!guest) {
        const completed = await completeConversation(conversationId, {
          durationSeconds,
          summary: evaluation.improved,
          newExpressions: evaluation.newExpressions,
          corrections: evaluation.corrections,
          mastery,
        }).catch(() => null);
        if (completed) {
          cloudMistake = await saveMistake({
            conversationId,
            original: evaluation.original,
            improved: evaluation.improved,
            reason: evaluation.reason,
            category: "expression",
          }).catch(() => null);
          cloudVocabulary = await saveVocabulary({
            conversationId,
            phrase: evaluation.improved,
            meaning: evaluation.reason,
            example: evaluation.improved,
          }).catch(() => null);
          void queryClient.invalidateQueries({
            queryKey: ["practice-history"],
          });
          void queryClient.invalidateQueries({ queryKey: ["mistakes"] });
          void queryClient.invalidateQueries({ queryKey: ["reports"] });
          void queryClient.invalidateQueries({ queryKey: ["vocabulary"] });
        }
      }
      addPracticeRecord({
        id: `practice-${conversationId}`,
        conversationId,
        sceneId: scene.id,
        completedAt: new Date().toISOString(),
        durationMinutes: evaluation.durationMinutes,
        newExpressions: evaluation.newExpressions,
        corrections: evaluation.corrections,
        mastery,
      });
      addMistake(
        cloudMistake ??
          createMistakeFromEvaluation(conversationId, scene.id, evaluation),
      );
      addVocabulary(
        cloudVocabulary ??
          createVocabularyFromEvaluation(
            conversationId,
            scene.id,
            evaluation,
          ),
      );
      router.push(
        `/practice/${conversationId}/review?scene=${encodeURIComponent(scene.slug)}`,
      );
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
              <span>{sceneDetail.partner[locale]}</span>
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
              title={t(
                errorCode === "not-configured"
                  ? "notConfiguredTitle"
                  : errorCode === "permission-denied"
                    ? "permissionDeniedTitle"
                    : "connectionErrorTitle",
              )}
              description={t(
                errorCode === "not-configured"
                  ? "notConfiguredDetail"
                  : errorCode === "permission-denied"
                    ? "permissionDeniedDetail"
                    : "connectionErrorDetail",
              )}
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
            onCantSay={() => setHint(openingExpression)}
            onHint={() => setHint(sceneDetail.phrases[1].expression)}
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
