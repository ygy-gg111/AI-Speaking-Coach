"use client";

import {
  AudioMutedOutlined,
  AudioOutlined,
  BulbOutlined,
  QuestionCircleOutlined,
  SendOutlined,
} from "@ant-design/icons";
import { Input, Select } from "antd";
import { FormEvent, useState } from "react";

import type { RealtimeConnectionState } from "../types";
import styles from "./voice-control-bar.module.css";

type VoiceControlBarProps = {
  state: RealtimeConnectionState;
  statusLabel: string;
  hintLabel: string;
  cantSayLabel: string;
  inputPlaceholder: string;
  sendLabel: string;
  microphoneLabel: string;
  onMicrophone: () => void;
  onHint: () => void;
  onCantSay: () => void;
  onSend: (text: string) => void;
  inputDevices?: MediaDeviceInfo[];
  selectedInputDeviceId?: string;
  deviceLabel?: string;
  onDeviceChange?: (deviceId: string) => void;
};

export function VoiceControlBar({
  state,
  statusLabel,
  hintLabel,
  cantSayLabel,
  inputPlaceholder,
  sendLabel,
  microphoneLabel,
  onMicrophone,
  onHint,
  onCantSay,
  onSend,
  inputDevices = [],
  selectedInputDeviceId,
  deviceLabel,
  onDeviceChange,
}: VoiceControlBarProps) {
  const [text, setText] = useState("");
  const isLive = [
    "listening",
    "user-speaking",
    "ai-thinking",
    "ai-speaking",
  ].includes(state);
  const isLoading = [
    "requesting-permission",
    "connecting",
    "reconnecting",
  ].includes(state);

  function submit(event: FormEvent) {
    event.preventDefault();
    const value = text.trim();
    if (!value) {
      return;
    }
    onSend(value);
    setText("");
  }

  return (
    <section className={styles.controls}>
      <div className={styles.actionRow}>
        <button type="button" className={styles.helpButton} onClick={onCantSay}>
          <QuestionCircleOutlined />
          {cantSayLabel}
        </button>

        <div className={styles.microphoneGroup}>
          <button
            type="button"
            className={`${styles.microphone} ${
              isLive ? styles.microphoneLive : ""
            } ${isLoading ? styles.microphoneLoading : ""}`}
            onClick={onMicrophone}
            aria-label={microphoneLabel}
            aria-pressed={isLive}
          >
            {state === "connected" || state === "ended" ? (
              <AudioMutedOutlined />
            ) : (
              <AudioOutlined />
            )}
            {isLive && (
              <>
                <i />
                <i />
              </>
            )}
          </button>
          <span>{statusLabel}</span>
        </div>

        <button type="button" className={styles.helpButton} onClick={onHint}>
          <BulbOutlined />
          {hintLabel}
        </button>
      </div>

      <form className={styles.textInput} onSubmit={submit}>
        <Input
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder={inputPlaceholder}
          variant="borderless"
          aria-label={inputPlaceholder}
        />
        <button type="submit" aria-label={sendLabel}>
          <SendOutlined />
        </button>
      </form>
      {inputDevices.length > 1 && onDeviceChange && (
        <Select
          value={selectedInputDeviceId}
          aria-label={deviceLabel}
          onChange={onDeviceChange}
          options={inputDevices.map((device, index) => ({
            value: device.deviceId,
            label: device.label || `${deviceLabel ?? "Microphone"} ${index + 1}`,
          }))}
        />
      )}
    </section>
  );
}
