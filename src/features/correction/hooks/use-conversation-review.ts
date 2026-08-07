"use client";

import { useMutation } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";

import type {
  ConversationReview,
  ReviewConversationMessage,
} from "@/features/conversation/types";

import {
  analyzeConversation,
  fetchConversationReview,
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
    let active = true;
    const localTimer = setTimeout(() => {
      if (active) setReview(readStoredReview(conversationId));
    }, 0);
    void fetchConversationReview(conversationId).then((stored) => {
      if (active && stored) {
        setReview(stored);
        storeReview(conversationId, stored);
      }
    }).catch(() => undefined);
    return () => {
      active = false;
      clearTimeout(localTimer);
    };
  }, [conversationId]);

  const {
    error,
    isPending,
    mutateAsync,
  } = useMutation({
    mutationFn: (input: {
      messages: ReviewConversationMessage[];
      durationSeconds: number;
      final?: boolean;
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
      final = false,
    ) => {
      const requestId = latestRequestRef.current + 1;
      latestRequestRef.current = requestId;
      const result = await mutateAsync({ messages, durationSeconds, final });
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
