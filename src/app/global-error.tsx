"use client";

import Link from "next/link";
import { useEffect } from "react";

import { reportClientError } from "@/features/observability/client-reporter";

import styles from "./global-error.module.css";

type GlobalErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalErrorPage({
  error,
  reset,
}: GlobalErrorPageProps) {
  useEffect(() => {
    void reportClientError({
      name: error.name || "Error",
      message: error.message || "Unknown application error",
      stack: error.stack,
      digest: error.digest,
      path: window.location.pathname,
      locale: window.location.pathname.startsWith("/en") ? "en" : "zh-CN",
    });
  }, [error]);

  return (
    <html lang="zh-CN">
      <body className={styles.body}>
        <main className={styles.card}>
          <span>AI Speaking Coach</span>
          <h1>页面暂时出了点问题</h1>
          <p>Something went wrong. You can retry or return to the homepage.</p>
          {error.digest && <small>Reference: {error.digest}</small>}
          <div>
            <button type="button" onClick={reset}>
              重试 / Retry
            </button>
            <Link href="/">返回首页 / Home</Link>
          </div>
        </main>
      </body>
    </html>
  );
}
