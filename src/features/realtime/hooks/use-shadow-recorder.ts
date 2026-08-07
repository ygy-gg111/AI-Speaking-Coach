"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { evaluatePronunciationRecording } from "../pronunciation-client";
import { scorePronunciation, type PronunciationScore } from "../pronunciation-score";

type BrowserRecognition = {
  lang: string;
  interimResults: boolean;
  onresult: ((event: { results: { 0: { 0: { transcript: string } } } }) => void) | null;
  start(): void;
  stop(): void;
};

export function useShadowRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [result, setResult] = useState<PronunciationScore | null>(null);
  const [error, setError] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recognitionRef = useRef<BrowserRecognition | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const contextRef = useRef<AudioContext | null>(null);
  const sampleTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAtRef = useRef(0);
  const targetRef = useRef("");
  const transcriptRef = useRef("");
  const energyRef = useRef<number[]>([]);

  const cleanup = useCallback(() => {
    if (sampleTimerRef.current) clearInterval(sampleTimerRef.current);
    sampleTimerRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    void contextRef.current?.close();
    contextRef.current = null;
  }, []);

  const start = useCallback(async (target: string) => {
    setError(null);
    setResult(null);
    targetRef.current = target;
    transcriptRef.current = "";
    energyRef.current = [];
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
    } catch (recordingError) {
      setError(
        recordingError instanceof Error
          ? recordingError.message
          : "Microphone access is unavailable.",
      );
      setIsRecording(false);
      return;
    }
    streamRef.current = stream;
    const context = new AudioContext();
    contextRef.current = context;
    const analyser = context.createAnalyser();
    analyser.fftSize = 1024;
    context.createMediaStreamSource(stream).connect(analyser);
    const samples = new Float32Array(analyser.fftSize);
    sampleTimerRef.current = setInterval(() => {
      analyser.getFloatTimeDomainData(samples);
      const rms = Math.sqrt(samples.reduce((sum, value) => sum + value * value, 0) / samples.length);
      energyRef.current.push(rms);
    }, 50);

    const recorder = new MediaRecorder(stream);
    recorderRef.current = recorder;
    const chunks: Blob[] = [];
    recorder.ondataavailable = (event) => {
      if (event.data.size) chunks.push(event.data);
    };
    recorder.onstop = async () => {
      const durationMs = Math.max(250, Date.now() - startedAtRef.current);
      const energy = energyRef.current;
      const pauseRatio = energy.length
        ? energy.filter((value) => value < 0.018).length / energy.length
        : 0;
      const mean = energy.length ? energy.reduce((sum, value) => sum + value, 0) / energy.length : 0;
      const deviation = energy.length
        ? Math.sqrt(energy.reduce((sum, value) => sum + (value - mean) ** 2, 0) / energy.length)
        : 0;
      const signals = {
        durationMs,
        pauseRatio,
        energyVariation: Math.min(1, mean ? deviation / mean : 0),
      };
      const audio = new Blob(chunks, { type: recorder.mimeType || "audio/webm" });
      cleanup();
      try {
        setResult(await evaluatePronunciationRecording({ audio, target: targetRef.current, signals }));
      } catch (evaluationError) {
        if (transcriptRef.current) {
          setResult(scorePronunciation(targetRef.current, transcriptRef.current, signals));
        } else {
          setError(evaluationError instanceof Error ? evaluationError.message : "Unable to evaluate pronunciation.");
        }
      } finally {
        setIsRecording(false);
      }
    };

    const constructor = (window as unknown as {
      SpeechRecognition?: new () => BrowserRecognition;
      webkitSpeechRecognition?: new () => BrowserRecognition;
    }).SpeechRecognition ?? (window as unknown as { webkitSpeechRecognition?: new () => BrowserRecognition }).webkitSpeechRecognition;
    if (constructor) {
      const recognition = new constructor();
      recognition.lang = "en-US";
      recognition.interimResults = false;
      recognition.onresult = (event) => {
        transcriptRef.current = event.results[0][0].transcript;
      };
      recognitionRef.current = recognition;
      try {
        recognition.start();
      } catch {
        recognitionRef.current = null;
      }
    }
    startedAtRef.current = Date.now();
    recorder.start(250);
    setIsRecording(true);
  }, [cleanup]);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
  }, []);

  useEffect(() => cleanup, [cleanup]);

  return { error, isRecording, result, start, stop };
}
