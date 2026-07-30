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

import type { AppLocale } from "@/i18n/routing";

import styles from "../feature-pages.module.css";

const phrases = [
  {
    id: "check-in",
    phrase: "check in",
    phonetic: "/tʃek ɪn/",
    meaning: { "zh-CN": "办理入住或值机", en: "register at a hotel or airport" },
    example: "I'd like to check in for my flight.",
    status: "today",
  },
  {
    id: "carry-on",
    phrase: "carry-on bag",
    phonetic: "/ˈkæri ɒn bæɡ/",
    meaning: { "zh-CN": "随身行李", en: "a bag taken into the cabin" },
    example: "Is this carry-on bag within the size limit?",
    status: "review",
  },
  {
    id: "reservation",
    phrase: "make a reservation",
    phonetic: "/meɪk ə ˌrezəˈveɪʃn/",
    meaning: { "zh-CN": "进行预订", en: "book a table, room, or service" },
    example: "I'd like to make a reservation for two.",
    status: "mastered",
  },
] as const;

export default function VocabularyPage() {
  const locale = useLocale() as AppLocale;
  const t = useTranslations("Vocabulary");
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [favorites, setFavorites] = useState<string[]>(["check-in"]);
  const visible = useMemo(
    () =>
      phrases.filter(
        (item) =>
          (filter === "all" ||
            item.status === filter ||
            (filter === "favorite" && favorites.includes(item.id))) &&
          `${item.phrase} ${item.meaning[locale]}`
            .toLowerCase()
            .includes(query.trim().toLowerCase()),
      ),
    [favorites, filter, locale, query],
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
            onChange={(value) => setFilter(String(value))}
            options={["all", "today", "review", "mastered", "favorite"].map(
              (value) => ({ value, label: t(`filter.${value}`) }),
            )}
          />
          <Input.Search
            allowClear
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("search")}
            style={{ maxWidth: 280 }}
          />
        </div>
        {visible.length ? (
          <div className={styles.list}>
            {visible.map((item) => (
              <article className={styles.listItem} key={item.id}>
                <div>
                  <Tag color={item.status === "mastered" ? "green" : "purple"}>
                    {t(`status.${item.status}`)}
                  </Tag>
                  <h3 className={styles.phrase}>{item.phrase}</h3>
                  <span className={styles.muted}>{item.phonetic}</span>
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
                    icon={
                      favorites.includes(item.id) ? (
                        <StarFilled />
                      ) : (
                        <StarOutlined />
                      )
                    }
                    aria-label={t("favorite", { phrase: item.phrase })}
                    onClick={() =>
                      setFavorites((current) =>
                        current.includes(item.id)
                          ? current.filter((id) => id !== item.id)
                          : [...current, item.id],
                      )
                    }
                  />
                  <Button
                    type="text"
                    icon={
                      item.status === "mastered" ? (
                        <CheckOutlined />
                      ) : (
                        <ClockCircleOutlined />
                      )
                    }
                  >
                    {t(
                      item.status === "mastered"
                        ? "mastered"
                        : "scheduleReview",
                    )}
                  </Button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <Empty description={t("empty")} />
        )}
      </section>
    </main>
  );
}
