"use client";

import {
  AppstoreOutlined,
  AudioOutlined,
  BookOutlined,
  CalendarOutlined,
  FireFilled,
  HomeFilled,
  HomeOutlined,
  LineChartOutlined,
  SettingOutlined,
  SoundFilled,
  StarOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Button, Tooltip } from "antd";
import { useLocale, useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { Link, usePathname } from "@/i18n/navigation";

import styles from "./app-shell.module.css";

type AppShellProps = {
  children: ReactNode;
};

const desktopItems = [
  { href: "/", key: "home", icon: HomeOutlined },
  { href: "/practice", key: "practice", icon: AudioOutlined },
  { href: "/my-scenes", key: "myScenes", icon: StarOutlined },
  { href: "/mistakes", key: "mistakes", icon: BookOutlined },
  { href: "/calendar", key: "calendar", icon: CalendarOutlined },
  { href: "/reports", key: "reports", icon: LineChartOutlined },
  { href: "/settings", key: "settings", icon: SettingOutlined },
] as const;

const mobileItems = [
  { href: "/", key: "home", icon: HomeOutlined, activeIcon: HomeFilled },
  { href: "/practice", key: "practiceShort", icon: AudioOutlined },
  { href: "/scenes", key: "scenes", icon: AppstoreOutlined },
  { href: "/calendar", key: "calendarShort", icon: CalendarOutlined },
  { href: "/my-scenes", key: "mine", icon: UserOutlined },
] as const;

function isActivePath(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations("Navigation");
  const isDocsPage = pathname === "/docs";
  const isAuthPage = pathname === "/login";

  if (isDocsPage || isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <Link href="/" className={styles.logo}>
          <span className={styles.logoMark}>
            <SoundFilled />
          </span>
          <span>
            <strong>AI</strong>
            <small>Speaking Coach</small>
          </span>
        </Link>

        <nav className={styles.desktopNav} aria-label={t("mainNavigation")}>
          {desktopItems.map((item) => {
            const active = isActivePath(pathname, item.href);
            const Icon = item.icon;
            return (
              <Link
                href={item.href}
                key={item.key}
                className={`${styles.navItem} ${active ? styles.active : ""}`}
              >
                <Icon />
                <span>{t(item.key)}</span>
              </Link>
            );
          })}
        </nav>

        <Link
          href={pathname}
          locale={locale === "zh-CN" ? "en" : "zh-CN"}
          className={styles.languageLink}
          aria-label={t("switchLanguage")}
        >
          <span>{locale === "zh-CN" ? "EN" : "中"}</span>
          <strong>{t("switchLanguage")}</strong>
        </Link>

        <div className={styles.streakCard}>
          <span>{t("streak")}</span>
          <strong>
            <FireFilled /> 15 {t("days")}
          </strong>
          <div className={styles.weekLabels}>
            {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
              <span key={`${day}-${index}`}>{day}</span>
            ))}
          </div>
          <div className={styles.weekDots}>
            {[0, 1, 2, 3, 4, 5, 6].map((day) => (
              <i key={day} className={day < 6 ? styles.checked : ""} />
            ))}
          </div>
        </div>
      </aside>

      <div className={styles.contentColumn}>
        <header className={styles.mobileHeader}>
          <Link href="/" className={styles.mobileLogo}>
            <span className={styles.logoMark}>
              <SoundFilled />
            </span>
            <strong>AI Coach</strong>
          </Link>
          <Tooltip title={t("switchLanguage")}>
            <Link href={pathname} locale={locale === "zh-CN" ? "en" : "zh-CN"}>
              <Button type="text" size="small">
                {locale === "zh-CN" ? "EN" : "中"}
              </Button>
            </Link>
          </Tooltip>
        </header>

        <div className={styles.content}>{children}</div>
      </div>

      <nav className={styles.mobileNav} aria-label={t("mobileNavigation")}>
        {mobileItems.map((item) => {
          const active = isActivePath(pathname, item.href);
          const Icon = active && "activeIcon" in item ? item.activeIcon : item.icon;
          return (
            <Link
              href={item.href}
              key={item.key}
              className={`${styles.mobileNavItem} ${
                active ? styles.mobileActive : ""
              }`}
            >
              <Icon />
              <span>{t(item.key)}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
