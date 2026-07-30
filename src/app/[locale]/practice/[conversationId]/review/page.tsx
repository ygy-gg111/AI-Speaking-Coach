"use client";

import { ArrowLeftOutlined, ReloadOutlined } from "@ant-design/icons";
import { Button } from "antd";
import { useTranslations } from "next-intl";

import { CoachEvaluationPanel } from "@/features/correction/components/coach-evaluation-panel";
import { mockEvaluation } from "@/features/conversation/mock-conversation";
import { Link } from "@/i18n/navigation";

import styles from "./review.module.css";

export default function PracticeReviewPage() {
  const t = useTranslations("Evaluation");

  return (
    <main className={styles.page}>
      <header>
        <Link href="/practice/demo">
          <Button type="text" icon={<ArrowLeftOutlined />}>
            {t("backToPractice")}
          </Button>
        </Link>
        <div>
          <span>AI Speaking Coach</span>
          <h1>{t("reviewTitle")}</h1>
          <p>{t("reviewSubtitle")}</p>
        </div>
      </header>

      <div className={styles.content}>
        <CoachEvaluationPanel evaluation={mockEvaluation} />
        <Link href="/practice/demo" className={styles.retry}>
          <Button type="primary" size="large" icon={<ReloadOutlined />} block>
            {t("retryScene")}
          </Button>
        </Link>
      </div>
    </main>
  );
}
