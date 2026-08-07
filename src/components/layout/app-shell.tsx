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
  LoginOutlined,
  ReadOutlined,
  SettingOutlined,
  SoundFilled,
  StarOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { Button, Tooltip } from "antd";
import { useLocale, useTranslations } from "next-intl";
import { useState, type ReactNode } from "react";

import { AuthModal, getCurrentUser } from "@/features/auth";
import { Link, usePathname, useRouter } from "@/i18n/navigation";

import styles from "./app-shell.module.css";

type AppShellProps = {
  children: ReactNode;
};

const desktopItems = [
  { href: "/", key: "home", icon: HomeOutlined },
  { href: "/practice", key: "practice", icon: AudioOutlined },
  { href: "/my-scenes", key: "myScenes", icon: StarOutlined },
  { href: "/mistakes", key: "mistakes", icon: BookOutlined },
  { href: "/vocabulary", key: "vocabulary", icon: ReadOutlined },
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
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("Navigation");
  const authT = useTranslations("Auth");
  const [authOpen, setAuthOpen] = useState(false);
  const userQuery = useQuery({
    queryKey: ["current-user"],
    queryFn: getCurrentUser,
    retry: false,
  });
  const isDocsPage = pathname === "/docs";
  const isAuthPage = pathname === "/login" || pathname === "/onboarding";

  if (isDocsPage || isAuthPage) {
    return <>{children}</>;
  }

  const user = userQuery.data;
  const displayName = user?.profile.displayName || user?.email.split("@")[0];
  const languageLabel = locale === "zh-CN" ? "EN" : "中";

  const finishAuthentication = () => {
    if (pathname.startsWith("/practice/guest-")) {
      router.replace("/practice");
    } else {
      router.refresh();
    }
  };

  return (
    <div className={styles.shell}>
      <a href="#main-content" className={styles.skipLink}>
        {t("skipToContent")}
      </a>
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
                aria-current={active ? "page" : undefined}
              >
                <Icon />
                <span>{t(item.key)}</span>
              </Link>
            );
          })}
        </nav>

        <div className={styles.accountArea}>
          {user ? (
            <Link href="/settings" className={styles.accountButton}>
              <span className={styles.accountAvatar}>
                {displayName?.slice(0, 1).toUpperCase()}
              </span>
              <span className={styles.accountCopy}>
                <strong>{displayName}</strong>
                <small>{user.email}</small>
              </span>
            </Link>
          ) : (
            <Button
              type="primary"
              icon={<LoginOutlined />}
              className={styles.loginButton}
              loading={userQuery.isPending}
              onClick={() => setAuthOpen(true)}
            >
              <span className={styles.loginLabel}>
                {authT("loginTab")} / {authT("registerTab")}
              </span>
            </Button>
          )}
        </div>

        <Link
          href={pathname}
          locale={locale === "zh-CN" ? "en" : "zh-CN"}
          className={styles.languageLink}
          aria-label={t("switchLanguage")}
        >
          <span>{languageLabel}</span>
          <strong>{t("switchLanguage")}</strong>
        </Link>

        <div
          className={styles.streakCard}
          role="status"
          aria-label={t("streakValue", { count: 15 })}
        >
          <span>{t("streak")}</span>
          <strong>
            <FireFilled /> 15 {t("days")}
          </strong>
          <div className={styles.weekLabels} aria-hidden="true">
            {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
              <span key={`${day}-${index}`}>{day}</span>
            ))}
          </div>
          <div className={styles.weekDots} aria-hidden="true">
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
          <div className={styles.mobileActions}>
            {user ? (
              <Tooltip title={user.email}>
                <Link href="/settings" aria-label={user.email}>
                  <Button type="text" shape="circle" icon={<UserOutlined />} />
                </Link>
              </Tooltip>
            ) : (
              <Button
                type="primary"
                size="small"
                icon={<LoginOutlined />}
                loading={userQuery.isPending}
                onClick={() => setAuthOpen(true)}
              >
                {authT("loginTab")}
              </Button>
            )}
            <Tooltip title={t("switchLanguage")}>
              <Link
                href={pathname}
                locale={locale === "zh-CN" ? "en" : "zh-CN"}
                aria-label={t("switchLanguage")}
              >
                <Button type="text" size="small">
                  {languageLabel}
                </Button>
              </Link>
            </Tooltip>
          </div>
        </header>

        <div id="main-content" className={styles.content} tabIndex={-1}>
          {children}
        </div>
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
              aria-current={active ? "page" : undefined}
            >
              <Icon />
              <span>{t(item.key)}</span>
            </Link>
          );
        })}
      </nav>

      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        onAuthenticated={finishAuthentication}
      />
    </div>
  );
}
