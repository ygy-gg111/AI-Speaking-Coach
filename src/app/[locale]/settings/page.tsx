"use client";

import {
  LoginOutlined,
  LogoutOutlined,
  SaveOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Avatar,
  Button,
  Form,
  Input,
  InputNumber,
  Select,
  Skeleton,
  Slider,
  Switch,
  message,
} from "antd";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import {
  AuthApiError,
  getCurrentUser,
  logout,
  updateProfile,
  type ProfileUpdateInput,
} from "@/features/auth";
import { Link, useRouter } from "@/i18n/navigation";

import styles from "./settings.module.css";

export default function SettingsPage() {
  const t = useTranslations("Settings");
  const locale = useLocale();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [form] = Form.useForm<ProfileUpdateInput>();
  const [messageApi, contextHolder] = message.useMessage();
  const [preferences, setPreferences] = useState({
    voice: "marin",
    speed: 1,
    correctionFrequency: "balanced",
    learningGoal: "daily",
    showChinese: true,
    autoPlay: true,
    saveAudio: false,
    saveConversation: true,
  });
  const userQuery = useQuery({
    queryKey: ["current-user"],
    queryFn: getCurrentUser,
    retry: false,
  });
  const profileMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: (user) => {
      queryClient.setQueryData(["current-user"], user);
      void messageApi.success(t("saved"));
    },
    onError: () => {
      void messageApi.error(t("saveFailed"));
    },
  });
  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: ["current-user"] });
      router.push("/login");
    },
  });

  useEffect(() => {
    if (userQuery.data) {
      form.setFieldsValue({
        displayName: userQuery.data.profile.displayName ?? "",
        level: userQuery.data.profile.level,
        dailyGoalMinutes: userQuery.data.profile.dailyGoalMinutes,
      });
    }
  }, [form, userQuery.data]);

  const isUnauthorized =
    userQuery.error instanceof AuthApiError &&
    userQuery.error.code === "AUTH_UNAUTHORIZED";

  if (userQuery.isPending) {
    return (
      <main className={styles.page}>
        <Skeleton active paragraph={{ rows: 8 }} />
      </main>
    );
  }

  if (!userQuery.data) {
    return (
      <main className={styles.page}>
        <header className={styles.header}>
          <span>{t("eyebrow")}</span>
          <h1>{t("title")}</h1>
          <p>{t("subtitle")}</p>
        </header>
        <section className={styles.guestCard}>
          <Avatar size={64} icon={<UserOutlined />} />
          <h2>{isUnauthorized ? t("guestTitle") : t("unavailableTitle")}</h2>
          <p>
            {isUnauthorized
              ? t("guestDescription")
              : t("unavailableDescription")}
          </p>
          {isUnauthorized ? (
            <Link href="/login">
              <Button type="primary" size="large" icon={<LoginOutlined />}>
                {t("login")}
              </Button>
            </Link>
          ) : (
            <Button size="large" onClick={() => void userQuery.refetch()}>
              {t("retry")}
            </Button>
          )}
        </section>
      </main>
    );
  }

  const user = userQuery.data;
  const displayName = user.profile.displayName || user.email.split("@")[0];

  return (
    <main className={styles.page}>
      {contextHolder}
      <header className={styles.header}>
        <span>{t("eyebrow")}</span>
        <h1>{t("title")}</h1>
        <p>{t("subtitle")}</p>
      </header>

      <section className={styles.profileLayout}>
        <aside className={styles.accountCard}>
          <Avatar size={72}>{displayName.slice(0, 1).toUpperCase()}</Avatar>
          <h2>{displayName}</h2>
          <p>{user.email}</p>
          <span>
            {t("memberSince", {
              date: formatMemberDate(user.createdAt, locale),
            })}
          </span>
          <Button
            danger
            type="text"
            icon={<LogoutOutlined />}
            loading={logoutMutation.isPending}
            onClick={() => logoutMutation.mutate()}
          >
            {t("logout")}
          </Button>
        </aside>

        <section className={styles.settingsCard}>
          <div className={styles.sectionTitle}>
            <span>{t("profileSection")}</span>
            <h2>{t("profileTitle")}</h2>
          </div>
          {profileMutation.isError && (
            <Alert
              type="error"
              showIcon
              message={t("saveFailed")}
              className={styles.alert}
            />
          )}
          <Form
            form={form}
            layout="vertical"
            requiredMark={false}
            onFinish={(values) => profileMutation.mutate(values)}
          >
            <Form.Item
              name="displayName"
              label={t("displayName")}
              rules={[
                { required: true, message: t("validation.nameRequired") },
                { max: 40, message: t("validation.nameLength") },
              ]}
            >
              <Input size="large" />
            </Form.Item>
            <Form.Item label={t("email")}>
              <Input size="large" value={user.email} disabled />
            </Form.Item>
            <div className={styles.formGrid}>
              <Form.Item
                name="level"
                label={t("level")}
                rules={[{ required: true }]}
              >
                <Select
                  size="large"
                  options={["A1", "A2", "B1", "B2", "C1", "C2"].map(
                    (level) => ({ value: level, label: level }),
                  )}
                />
              </Form.Item>
              <Form.Item
                name="dailyGoalMinutes"
                label={t("dailyGoal")}
                rules={[{ required: true }]}
              >
                <InputNumber
                  size="large"
                  min={5}
                  max={120}
                  step={5}
                  addonAfter={t("minutes")}
                />
              </Form.Item>
            </div>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              icon={<SaveOutlined />}
              loading={profileMutation.isPending}
            >
              {t("save")}
            </Button>
          </Form>
        </section>
      </section>

      <section className={styles.preferenceGrid}>
        <article className={styles.settingsCard}>
          <div className={styles.sectionTitle}>
            <span>{t("aiSection")}</span>
            <h2>{t("aiTitle")}</h2>
          </div>
          <div className={styles.preferenceRow}>
            <div>
              <strong>{t("learningGoal")}</strong>
              <p>{t("learningGoalDescription")}</p>
            </div>
            <Select
              value={preferences.learningGoal}
              onChange={(value) =>
                setPreferences((current) => ({
                  ...current,
                  learningGoal: value,
                }))
              }
              options={["travel", "work", "daily", "interview"].map(
                (value) => ({
                  value,
                  label: t(`goal.${value}`),
                }),
              )}
            />
          </div>
          <div className={styles.preferenceRow}>
            <div>
              <strong>{t("correctionFrequency")}</strong>
              <p>{t("correctionDescription")}</p>
            </div>
            <Select
              value={preferences.correctionFrequency}
              onChange={(value) =>
                setPreferences((current) => ({
                  ...current,
                  correctionFrequency: value,
                }))
              }
              options={["gentle", "balanced", "detailed"].map((value) => ({
                value,
                label: t(`correction.${value}`),
              }))}
            />
          </div>
          <div className={styles.preferenceRow}>
            <div>
              <strong>{t("showChinese")}</strong>
              <p>{t("showChineseDescription")}</p>
            </div>
            <Switch
              checked={preferences.showChinese}
              onChange={(checked) =>
                setPreferences((current) => ({
                  ...current,
                  showChinese: checked,
                }))
              }
            />
          </div>
        </article>

        <article className={styles.settingsCard}>
          <div className={styles.sectionTitle}>
            <span>{t("voiceSection")}</span>
            <h2>{t("voiceTitle")}</h2>
          </div>
          <div className={styles.preferenceRow}>
            <div>
              <strong>{t("voice")}</strong>
              <p>{t("voiceDescription")}</p>
            </div>
            <Select
              value={preferences.voice}
              onChange={(value) =>
                setPreferences((current) => ({ ...current, voice: value }))
              }
              options={[
                { value: "marin", label: "Marin" },
                { value: "cedar", label: "Cedar" },
              ]}
            />
          </div>
          <div className={styles.preferenceRow}>
            <div>
              <strong>{t("speechSpeed")}</strong>
              <p>{t("speechSpeedDescription")}</p>
            </div>
            <Slider
              min={0.75}
              max={1.25}
              step={0.25}
              value={preferences.speed}
              marks={{ 0.75: "0.75×", 1: "1×", 1.25: "1.25×" }}
              onChange={(value) =>
                setPreferences((current) => ({ ...current, speed: value }))
              }
            />
          </div>
          <div className={styles.preferenceRow}>
            <div>
              <strong>{t("autoPlay")}</strong>
              <p>{t("autoPlayDescription")}</p>
            </div>
            <Switch
              checked={preferences.autoPlay}
              onChange={(checked) =>
                setPreferences((current) => ({
                  ...current,
                  autoPlay: checked,
                }))
              }
            />
          </div>
        </article>

        <article className={styles.settingsCard}>
          <div className={styles.sectionTitle}>
            <span>{t("privacySection")}</span>
            <h2>{t("privacyTitle")}</h2>
          </div>
          <div className={styles.preferenceRow}>
            <div>
              <strong>{t("saveAudio")}</strong>
              <p>{t("saveAudioDescription")}</p>
            </div>
            <Switch
              checked={preferences.saveAudio}
              onChange={(checked) =>
                setPreferences((current) => ({
                  ...current,
                  saveAudio: checked,
                }))
              }
            />
          </div>
          <div className={styles.preferenceRow}>
            <div>
              <strong>{t("saveConversation")}</strong>
              <p>{t("saveConversationDescription")}</p>
            </div>
            <Switch
              checked={preferences.saveConversation}
              onChange={(checked) =>
                setPreferences((current) => ({
                  ...current,
                  saveConversation: checked,
                }))
              }
            />
          </div>
          <Button danger disabled>
            {t("deleteData")}
          </Button>
        </article>
      </section>

      <Button
        className={styles.preferenceSave}
        size="large"
        type="primary"
        icon={<SaveOutlined />}
        onClick={() => {
          localStorage.setItem(
            "ai-speaking-preferences",
            JSON.stringify(preferences),
          );
          void messageApi.success(t("preferencesSaved"));
        }}
      >
        {t("savePreferences")}
      </Button>
    </main>
  );
}

function formatMemberDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
  }).format(new Date(value));
}
