"use client";

import {
  ArrowLeftOutlined,
  CloseOutlined,
  CustomerServiceOutlined,
  SwapOutlined,
} from "@ant-design/icons";
import { Button } from "antd";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

import { CoachEvaluationPanel } from "@/features/correction/components/coach-evaluation-panel";
import { SceneCover } from "@/features/scenes/components/scene-cover";
import { mockScenes } from "@/features/scenes/mock-scenes";
import { Link, useRouter } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { useRealtimeStore } from "@/stores/realtime-store";

import {
  mockConversationMessages,
  mockEvaluation,
} from "../mock-conversation";
import type { ConversationMessage } from "../types";
import { ConversationTimeline } from "./conversation-timeline";
import { VoiceControlBar } from "../../realtime/components/voice-control-bar";
import styles from "./practice-session.module.css";

export function PracticeSession() {
  const locale = useLocale() as AppLocale;
  const t = useTranslations("Practice");
  const router = useRouter();
  const state = useRealtimeStore((store) => store.state);
  const transitionTo = useRealtimeStore((store) => store.transitionTo);
  const resetRealtime = useRealtimeStore((store) => store.reset);
  const [messages, setMessages] = useState<ConversationMessage[]>(
    mockConversationMessages,
  );
  const [hint, setHint] = useState<string | null>(null);
  const timers = useRef<Array<ReturnType<typeof setTimeout>>>([]);
  const scene = mockScenes[1];

  useEffect(() => {
    resetRealtime();
    return () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
  }, [resetRealtime]);

  function schedule(callback: () => void, delay: number) {
    const timer = setTimeout(callback, delay);
    timers.current.push(timer);
  }

  function startDemoConnection() {
    const current = useRealtimeStore.getState().state;
    if (current === "error" || current === "ended") {
      resetRealtime();
    }

    useRealtimeStore.getState().transitionTo("requesting-permission");
    schedule(() => {
      useRealtimeStore.getState().transitionTo("connecting");
    }, 350);
    schedule(() => {
      useRealtimeStore.getState().transitionTo("connected");
      useRealtimeStore.getState().transitionTo("listening");
    }, 1050);
  }

  function handleMicrophone() {
    if (state === "idle" || state === "error" || state === "ended") {
      startDemoConnection();
      return;
    }

    if (state === "connected") {
      transitionTo("listening");
      return;
    }

    if (
      state === "listening" ||
      state === "user-speaking" ||
      state === "ai-speaking"
    ) {
      transitionTo("connected");
    }
  }

  function handleSend(text: string) {
    const userMessage: ConversationMessage = {
      id: `message-user-${Date.now()}`,
      role: "user",
      text: { "zh-CN": text, en: text },
      audioAvailable: false,
    };
    setMessages((current) => [...current, userMessage]);
    setHint(null);

    const currentState = useRealtimeStore.getState().state;
    if (currentState === "listening") {
      useRealtimeStore.getState().transitionTo("user-speaking");
      useRealtimeStore.getState().transitionTo("ai-thinking");
    } else if (currentState === "connected") {
      useRealtimeStore.getState().transitionTo("ai-thinking");
    }

    schedule(() => {
      const assistantMessage: ConversationMessage = {
        id: `message-assistant-${Date.now()}`,
        role: "assistant",
        text: {
          "zh-CN": "Thanks. Do you have any bags to check in?",
          en: "Thanks. Do you have any bags to check in?",
        },
        translation: {
          "zh-CN": "谢谢。你有需要托运的行李吗？",
          en: "谢谢。你有需要托运的行李吗？",
        },
        audioAvailable: true,
      };
      setMessages((current) => [...current, assistantMessage]);

      if (useRealtimeStore.getState().state === "ai-thinking") {
        useRealtimeStore.getState().transitionTo("ai-speaking");
        schedule(() => {
          useRealtimeStore.getState().transitionTo("listening");
        }, 1400);
      }
    }, 700);
  }

  function endPractice() {
    const currentState = useRealtimeStore.getState().state;
    if (!["idle", "ended"].includes(currentState)) {
      useRealtimeStore.getState().transitionTo("ended");
    }
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
