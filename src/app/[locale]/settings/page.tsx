"use client";

import { useTranslations } from "next-intl";

import { FeaturePlaceholder } from "@/components/ui/feature-placeholder";

export default function SettingsPage() {
  const t = useTranslations("Placeholder");
  return (
    <FeaturePlaceholder
      title={t("settingsTitle")}
      description={t("settingsDescription")}
    />
  );
}
