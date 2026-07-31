"use client";

import { LoadingOutlined } from "@ant-design/icons";
import type { ReactNode } from "react";
import { useState } from "react";

import { useRouter } from "@/i18n/navigation";

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
    } catch {
      conversationId = `guest-${crypto.randomUUID()}`;
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
