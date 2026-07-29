"use client";

import { ArrowRightOutlined, BulbOutlined } from "@ant-design/icons";
import { Button } from "antd";

import { Link } from "@/i18n/navigation";

import styles from "./feature-placeholder.module.css";

type FeaturePlaceholderProps = {
  title: string;
  description: string;
  actionLabel?: string;
};

export function FeaturePlaceholder({
  title,
  description,
  actionLabel,
}: FeaturePlaceholderProps) {
  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <span className={styles.icon}>
          <BulbOutlined />
        </span>
        <span className={styles.eyebrow}>AI Speaking Coach</span>
        <h1>{title}</h1>
        <p>{description}</p>
        {actionLabel && (
          <Link href="/scenes">
            <Button type="primary" icon={<ArrowRightOutlined />}>
              {actionLabel}
            </Button>
          </Link>
        )}
      </section>
    </main>
  );
}
