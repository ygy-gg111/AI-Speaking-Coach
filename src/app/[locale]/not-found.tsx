"use client";

import { HomeOutlined, SearchOutlined } from "@ant-design/icons";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";

import styles from "./not-found.module.css";

export default function LocaleNotFound() {
  const t = useTranslations("RouteStates");

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <span className={styles.code} aria-hidden="true">
          404
        </span>
        <span className={styles.icon} aria-hidden="true">
          <SearchOutlined />
        </span>
        <h1>{t("notFoundTitle")}</h1>
        <p>{t("notFoundDescription")}</p>
        <div className={styles.actions}>
          <Link href="/" className={`${styles.action} ${styles.primaryAction}`}>
            <HomeOutlined aria-hidden="true" />
            {t("backHome")}
          </Link>
          <Link
            href="/scenes"
            className={`${styles.action} ${styles.secondaryAction}`}
          >
            {t("browseScenes")}
          </Link>
        </div>
      </section>
    </main>
  );
}
