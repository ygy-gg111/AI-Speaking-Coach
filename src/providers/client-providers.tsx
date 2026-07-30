"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { App, ConfigProvider, theme } from "antd";
import enUS from "antd/locale/en_US";
import zhCN from "antd/locale/zh_CN";
import { useEffect, useState, type ReactNode } from "react";

import type { AppLocale } from "@/i18n/routing";
import { useLearningStore } from "@/stores/learning-store";

type ClientProvidersProps = {
  children: ReactNode;
  locale: AppLocale;
};

export function ClientProviders({ children, locale }: ClientProvidersProps) {
  const [queryClient] = useState(() => new QueryClient());

  useEffect(() => {
    void useLearningStore.persist.rehydrate();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider
        locale={locale === "zh-CN" ? zhCN : enUS}
        theme={{
          algorithm: theme.defaultAlgorithm,
          token: {
            colorPrimary: "#7157f5",
            colorSuccess: "#47bb78",
            colorWarning: "#f4a21e",
            colorError: "#ef4759",
            colorText: "#202236",
            colorTextSecondary: "#77798d",
            colorBgLayout: "#f7f8fc",
            borderRadius: 14,
            controlHeight: 40,
            fontFamily:
              'Inter, "PingFang SC", "Microsoft YaHei", Arial, sans-serif',
          },
          components: {
            Button: {
              borderRadius: 12,
              primaryShadow: "none",
            },
            Card: {
              borderRadiusLG: 16,
            },
            Input: {
              activeShadow: "0 0 0 3px rgba(113, 87, 245, 0.12)",
            },
          },
        }}
      >
        <App>{children}</App>
      </ConfigProvider>
    </QueryClientProvider>
  );
}
