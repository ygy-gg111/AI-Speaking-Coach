"use client";

import { useTranslations } from "next-intl";

import { FeaturePlaceholder } from "@/components/ui/feature-placeholder";

export default function CalendarPage() {
  const t = useTranslations("Placeholder");
  return (
    <FeaturePlaceholder
      title={t("calendarTitle")}
      description={t("calendarDescription")}
    />
  );
}
