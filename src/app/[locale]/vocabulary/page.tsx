"use client";

import {
  AudioOutlined,
  CheckOutlined,
  ClockCircleOutlined,
  StarFilled,
  StarOutlined,
} from "@ant-design/icons";
import { Button, Empty, Input, Segmented, Tag } from "antd";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import {
  useCloudVocabulary,
  useVocabularyAction,
} from "@/features/vocabulary/hooks/use-vocabulary";
import {
  filterVocabulary,
  getVocabularyStatus,
} from "@/features/vocabulary/vocabulary-data";
import type { VocabularyFilter } from "@/features/vocabulary/types";
import type { AppLocale } from "@/i18n/routing";
import { useLearningStore } from "@/stores/learning-store";

import styles from "../feature-pages.module.css";

export default function VocabularyPage() {
  const locale = useLocale() as AppLocale;
  const t = useTranslations("Vocabulary");
  const vocabulary = useLearningStore((store) => store.vocabulary);
  useCloudVocabulary();
  const runAction = useVocabularyAction();
  const [filter, setFilter] = useState<VocabularyFilter>("all");
  const [query, setQuery] = useState("");
  const visible = useMemo(
    () => filterVocabulary(vocabulary, filter, query, locale),
    [filter, locale, query, vocabulary],
  );

  function speak(text: string) {
    speechSynthesis.cancel();
    speechSynthesis.speak(new SpeechSynthesisUtterance(text));
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <span>{t("eyebrow")}</span>
          <h1>{t("title")}</h1>
          <p>{t("subtitle")}</p>
        </div>
      </header>
      <section className={styles.card}>
        <div className={styles.header}>
          <Segmented
            value={filter}
            onChange={(value) =>
              setFilter(String(value) as VocabularyFilter)
            }
            options={[
              "all",
              "today",
              "review",
              "mastered",
              "favorite",
            ].map((value) => ({ value, label: t(`filter.${value}`) }))}
            aria-label={t("filterLabel")}
          />
          <Input.Search
            allowClear
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("search")}
            aria-label={t("search")}
            style={{ maxWidth: 280 }}
          />
        </div>
        {visible.length ? (
          <div className={styles.list} aria-live="polite">
            {visible.map((item) => {
              const status = getVocabularyStatus(item);
              return (
                <article className={styles.listItem} key={item.id}>
                  <div>
                    <Tag color={status === "mastered" ? "green" : "purple"}>
                      {t(`status.${status}`)}
                    </Tag>
                    <h3 className={styles.phrase}>{item.phrase}</h3>
                    {item.phonetic ? (
                      <span className={styles.muted}>{item.phonetic}</span>
                    ) : null}
                    <p>{item.meaning[locale]}</p>
                    <p className={styles.muted}>{item.example}</p>
                  </div>
                  <div>
                    <Button
                      shape="circle"
                      icon={<AudioOutlined />}
                      aria-label={t("play", { phrase: item.phrase })}
                      onClick={() => speak(item.phrase)}
                    />
                    <Button
                      type="text"
                      shape="circle"
                      icon={item.favorite ? <StarFilled /> : <StarOutlined />}
                      aria-label={t("favorite", { phrase: item.phrase })}
                      onClick={() =>
                        runAction(item.id, {
                          action: "favorite",
                          favorite: !item.favorite,
                        })
                      }
                    />
                    <Button
                      type="text"
                      disabled={status === "mastered"}
                      icon={
                        status === "mastered" ? (
                          <CheckOutlined />
                        ) : (
                          <ClockCircleOutlined />
                        )
                      }
                      aria-label={t("review", { phrase: item.phrase })}
                      onClick={() => runAction(item.id, { action: "review" })}
                    >
                      {t(
                        status === "mastered"
                          ? "mastered"
                          : "scheduleReview",
                      )}
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <Empty description={t("empty")} />
        )}
      </section>
    </main>
  );
}
