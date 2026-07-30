"use client";

import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  CheckOutlined,
} from "@ant-design/icons";
import { Button, Progress } from "antd";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { useRouter } from "@/i18n/navigation";

import styles from "../feature-pages.module.css";

const options = [
  ["travel", "work", "daily", "interview"],
  ["A1", "A2", "B1", "B2"],
  ["airport", "coffee", "meeting", "hotel"],
  ["5", "10", "15", "20"],
] as const;

export default function OnboardingPage() {
  const t = useTranslations("Onboarding");
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const selected = answers[step];

  function choose(value: string) {
    setAnswers((current) => {
      const next = [...current];
      next[step] = value;
      return next;
    });
  }

  function finish() {
    localStorage.setItem(
      "ai-speaking-onboarding",
      JSON.stringify({
        goal: answers[0],
        level: answers[1],
        scene: answers[2],
        dailyGoalMinutes: Number(answers[3]),
        completedAt: new Date().toISOString(),
      }),
    );
    router.push(`/scenes/${answers[2] === "airport" ? "scene-airport" : `scene-${answers[2]}`}`);
  }

  return (
    <main className={styles.page}>
      <section className={styles.heroCard}>
        <div className={styles.stepMeta}>
          <span>{t("step", { current: step + 1, total: options.length })}</span>
          <strong>{t("brand")}</strong>
        </div>
        <Progress
          percent={((step + 1) / options.length) * 100}
          showInfo={false}
          strokeColor="#7157f5"
        />
        <header className={styles.header}>
          <div>
            <span>{t(`steps.${step}.eyebrow`)}</span>
            <h1>{t(`steps.${step}.title`)}</h1>
            <p>{t(`steps.${step}.description`)}</p>
          </div>
        </header>
        <div className={styles.choiceGrid}>
          {options[step].map((option) => (
            <button
              type="button"
              key={option}
              className={`${styles.choice} ${
                selected === option ? styles.choiceActive : ""
              }`}
              onClick={() => choose(option)}
              aria-pressed={selected === option}
            >
              <strong>{t(`options.${option}.title`)}</strong>
              <span>{t(`options.${option}.description`)}</span>
            </button>
          ))}
        </div>
        <div className={styles.actions}>
          <Button
            icon={<ArrowLeftOutlined />}
            disabled={step === 0}
            onClick={() => setStep((current) => current - 1)}
          >
            {t("back")}
          </Button>
          {step < options.length - 1 ? (
            <Button
              type="primary"
              disabled={!selected}
              onClick={() => setStep((current) => current + 1)}
            >
              {t("next")} <ArrowRightOutlined />
            </Button>
          ) : (
            <Button
              type="primary"
              icon={<CheckOutlined />}
              disabled={!selected}
              onClick={finish}
            >
              {t("finish")}
            </Button>
          )}
        </div>
      </section>
    </main>
  );
}
