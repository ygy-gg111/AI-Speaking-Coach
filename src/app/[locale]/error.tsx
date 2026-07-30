"use client";

import {
  HomeOutlined,
  ReloadOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { Button } from "antd";
import { useLocale, useTranslations } from "next-intl";
import { useEffect } from "react";

import { reportClientError } from "@/features/observability/client-reporter";
import { Link } from "@/i18n/navigation";

import styles from "./error.module.css";

type LocaleErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function LocaleErrorPage({
  error,
  reset,
}: LocaleErrorPageProps) {
  const locale = useLocale();
  const t = useTranslations("ErrorBoundary");

  useEffect(() => {
    void reportClientError({
      name: error.name || "Error",
      message: error.message || "Unknown route error",
      stack: error.stack,
      digest: error.digest,
      path: window.location.pathname,
      locale,
    });
  }, [error, locale]);

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <span className={styles.icon}>
          <WarningOutlined />
        </span>
        <span className={styles.eyebrow}>{t("eyebrow")}</span>
        <h1>{t("title")}</h1>
        <p>{t("description")}</p>
        {error.digest && (
          <small>{t("reference", { value: error.digest })}</small>
        )}
        <div className={styles.actions}>
          <Button
            type="primary"
            size="large"
            icon={<ReloadOutlined />}
            onClick={reset}
          >
            {t("retry")}
          </Button>
          <Link href="/">
            <Button size="large" icon={<HomeOutlined />}>
              {t("home")}
            </Button>
          </Link>
        </div>
      </section>
    </main>
  );
}
