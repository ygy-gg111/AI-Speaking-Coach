"use client";

import { useTranslations } from "next-intl";

import { FeaturePlaceholder } from "@/components/ui/feature-placeholder";

export default function ReportsPage() {
  const t = useTranslations("Placeholder");
  return (
    <FeaturePlaceholder
      title={t("reportsTitle")}
      description={t("reportsDescription")}
    />
  );
}
