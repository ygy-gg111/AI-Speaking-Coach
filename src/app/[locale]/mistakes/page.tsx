"use client";

import { useTranslations } from "next-intl";

import { FeaturePlaceholder } from "@/components/ui/feature-placeholder";

export default function MistakesPage() {
  const t = useTranslations("Placeholder");
  return (
    <FeaturePlaceholder
      title={t("mistakesTitle")}
      description={t("mistakesDescription")}
    />
  );
}
