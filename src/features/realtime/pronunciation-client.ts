import type { PronunciationScore, PronunciationSignals } from "./pronunciation-score";

type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } };

export async function evaluatePronunciationRecording(input: {
  audio: Blob;
  sceneId: string;
  target: string;
  signals: Required<PronunciationSignals>;
}) {
  const form = new FormData();
  form.set("audio", input.audio, `shadow-${Date.now()}.webm`);
  form.set("sceneId", input.sceneId);
  form.set("target", input.target);
  form.set("durationMs", String(input.signals.durationMs));
  form.set("pauseRatio", String(input.signals.pauseRatio));
  form.set("energyVariation", String(input.signals.energyVariation));
  const response = await fetch("/api/v1/pronunciation/evaluate", {
    method: "POST",
    body: form,
  });
  const payload = (await response.json()) as ApiResponse<PronunciationScore>;
  if (!response.ok || !payload.success) {
    throw new Error(payload.success ? "Unable to evaluate pronunciation." : payload.error.message);
  }
  return payload.data;
}
