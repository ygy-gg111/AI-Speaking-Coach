"use client";

import { useTranslations } from "next-intl";

import { FeaturePlaceholder } from "@/components/ui/feature-placeholder";

export default function MyScenesPage() {
  const t = useTranslations("Placeholder");
  return (
    <FeaturePlaceholder
      title={t("myScenesTitle")}
      description={t("myScenesDescription")}
      actionLabel={t("browseScenes")}
    />
  );
}
