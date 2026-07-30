"use client";

import { useTranslations } from "next-intl";

import styles from "./loading.module.css";

export default function LocaleLoading() {
  const t = useTranslations("RouteStates");

  return (
    <main
      className={styles.page}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span className={styles.srOnly}>{t("loading")}</span>
      <div className={`${styles.line} ${styles.eyebrow}`} aria-hidden="true" />
      <div className={`${styles.line} ${styles.title}`} aria-hidden="true" />
      <div className={`${styles.line} ${styles.subtitle}`} aria-hidden="true" />
      <section className={styles.metrics} aria-hidden="true">
        {[0, 1, 2, 3].map((item) => (
          <div className={styles.card} key={item} />
        ))}
      </section>
      <section className={styles.contentGrid} aria-hidden="true">
        <div className={styles.largeCard} />
        <div className={styles.sideCard} />
      </section>
    </main>
  );
}
