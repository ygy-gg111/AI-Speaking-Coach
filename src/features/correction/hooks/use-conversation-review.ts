"use client";

import { useMutation } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";

import type {
  ConversationReview,
  ReviewConversationMessage,
} from "@/features/conversation/types";

import {
  analyzeConversation,
  readStoredReview,
  storeReview,
} from "../review-client";

type UseConversationReviewOptions = {
  conversationId: string;
  sceneName: string;
  learnerLevel: string;
};

export function useConversationReview({
  conversationId,
  sceneName,
  learnerLevel,
}: UseConversationReviewOptions) {
  const [review, setReview] = useState<ConversationReview | null>(null);
  const latestRequestRef = useRef(0);
  useEffect(() => {
    const timer = setTimeout(() => {
      setReview(readStoredReview(conversationId));
    }, 0);
    return () => clearTimeout(timer);
  }, [conversationId]);

  const {
    error,
    isPending,
    mutateAsync,
  } = useMutation({
    mutationFn: (input: {
      messages: ReviewConversationMessage[];
      durationSeconds: number;
    }) =>
      analyzeConversation({
        conversationId,
        sceneName,
        learnerLevel,
        ...input,
      }),
  });

  const analyze = useCallback(
    async (
      messages: ReviewConversationMessage[],
      durationSeconds: number,
    ) => {
      const requestId = latestRequestRef.current + 1;
      latestRequestRef.current = requestId;
      const result = await mutateAsync({ messages, durationSeconds });
      if (requestId === latestRequestRef.current) {
        setReview(result);
        storeReview(conversationId, result);
      }
      return result;
    },
    [conversationId, mutateAsync],
  );

  return {
    analyze,
    error,
    isAnalyzing: isPending,
    review,
  };
}
