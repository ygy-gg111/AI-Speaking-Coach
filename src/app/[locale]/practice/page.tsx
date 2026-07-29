"use client";

import { useTranslations } from "next-intl";

import { FeaturePlaceholder } from "@/components/ui/feature-placeholder";

export default function PracticePage() {
  const t = useTranslations("Placeholder");
  return (
    <FeaturePlaceholder
      title={t("practiceTitle")}
      description={t("practiceDescription")}
      actionLabel={t("browseScenes")}
    />
  );
}
