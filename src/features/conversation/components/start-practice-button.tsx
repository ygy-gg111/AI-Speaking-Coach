"use client";

import { LoadingOutlined } from "@ant-design/icons";
import { message } from "antd";
import type { ReactNode } from "react";
import { useState } from "react";

import { useRouter } from "@/i18n/navigation";
import { ApiClientError } from "@/lib/api-client";

import type { Scene } from "../../scenes/types";
import { createConversation } from "../conversation-client";

type StartPracticeButtonProps = {
  scene: Scene;
  className?: string;
  children?: ReactNode;
  "aria-label"?: string;
};

export function StartPracticeButton({
  scene,
  className,
  children,
  "aria-label": ariaLabel,
}: StartPracticeButtonProps) {
  const router = useRouter();
  const [isStarting, setIsStarting] = useState(false);

  async function startPractice() {
    if (isStarting) {
      return;
    }
    setIsStarting(true);
    let conversationId: string;
    try {
      const conversation = await createConversation(scene.id);
      conversationId = conversation.id;
    } catch (error) {
      if (error instanceof ApiClientError && error.status === 401) {
        conversationId = `guest-${crypto.randomUUID()}`;
      } else {
        setIsStarting(false);
        void message.error(
          error instanceof Error
            ? error.message
            : "Unable to start the practice session.",
        );
        return;
      }
    }
    router.push(
      `/practice/${conversationId}?scene=${encodeURIComponent(scene.slug)}`,
    );
  }

  return (
    <button
      type="button"
      className={className}
      aria-label={ariaLabel}
      aria-busy={isStarting}
      disabled={isStarting}
      onClick={() => void startPractice()}
    >
      {isStarting && <LoadingOutlined aria-hidden="true" />}
      {children}
    </button>
  );
}
