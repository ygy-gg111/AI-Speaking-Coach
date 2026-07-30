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
  message,
} from "antd";
import { useLocale, useTranslations } from "next-intl";
import { useEffect } from "react";

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
    </main>
  );
}

function formatMemberDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
  }).format(new Date(value));
}
